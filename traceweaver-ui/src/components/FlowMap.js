import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
    useNodesState,
    useEdgesState,
    Background,
    Controls,
    MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { fetchTraces } from '../utils/jaegerApi';

const FlowMap = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const transformTraceToGraph = useCallback((traceData) => {

        if (!traceData || !traceData.data || traceData.data.length === 0) {
            return;
        }

        const newNodes = [];
        const newEdges = [];

        // Find the trace with the most spans (likely the most complete one)
        const trace = traceData.data.reduce((prev, current) => {
            return (prev.spans.length > current.spans.length) ? prev : current;
        });


        const spans = trace.spans;

        // Simple layout calculation (horizontal)
        let xOffset = 0;
        const yOffset = 100;
        const xSpacing = 250;

        // Sort spans by start time to layout left-to-right roughly
        spans.sort((a, b) => a.startTime - b.startTime);

        spans.forEach((span, index) => {
            const isError = span.tags.some(tag =>
                (tag.key === 'http.status_code' && tag.value >= 500) ||
                (tag.key === 'otel.status_code' && tag.value === 'ERROR') ||
                (tag.key === 'error' && tag.value === true)
            );

            const nodeColor = isError ? '#ffcccc' : '#ccffcc';
            const borderColor = isError ? '#ff0000' : '#00ff00';

            newNodes.push({
                id: span.spanID,
                data: { label: `${span.processID} \n ${span.operationName}` },
                position: { x: xOffset + (index * xSpacing), y: yOffset },
                style: {
                    background: nodeColor,
                    border: `1px solid ${borderColor}`,
                    width: 180,
                    borderRadius: 5,
                    padding: 10,
                    textAlign: 'center'
                },
            });

            const parentRef = span.references.find(ref => ref.refType === 'CHILD_OF');
            if (parentRef) {
                newEdges.push({
                    id: `e${parentRef.spanID}-${span.spanID}`,
                    source: parentRef.spanID,
                    target: span.spanID,
                    animated: true,
                    style: { stroke: '#000' },
                });
            }
        });

        if (trace.processes) {
            newNodes.forEach(node => {
                const span = spans.find(s => s.spanID === node.id);
                if (span) {
                    const process = trace.processes[span.processID];
                    if (process) {
                        node.data.label = `${process.serviceName}\n${span.operationName}`;
                    } else {
                        node.data.label = `${span.processID || 'Unknown'}\n${span.operationName}`;
                    }
                }
            });
        }

        setNodes(newNodes);
        setEdges(newEdges);
    }, [setNodes, setEdges]);

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchTraces();
            if (data) {
                transformTraceToGraph(data);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, [transformTraceToGraph]);

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
};

export default FlowMap;
