let nodes = [];
        let lines = [];
        let history = [];
        let redoStack = [];
        let selectedNodes = [];
    
        document.getElementById('newMindMap').addEventListener('click', function() {
            if (confirm('Are you sure you want to create a new Mind Map?')) {
                clearMindMap();
            }
            alert('New Mind Map created!');
        });
    
        document.getElementById('saveMindMap').addEventListener('click', function() {
            renderMindMapToCanvas();
            downloadMindMapImage();
            alert('Mind Map saved!');
        });
    
        document.getElementById('deleteMindMap').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this Mind Map?')) {
                deleteSelectedNodes();
                saveHistory();
            }
        });
    
        document.getElementById('addNode').addEventListener('click', function() {
            const nodeId = 'node-' + (nodes.length + 1);
            const newNode = createNode(nodeId, 50, 50);
            document.getElementById('mindMapCanvas').appendChild(newNode);
            nodes.push(newNode);
            saveHistory();
        });
    
        document.getElementById('connectNodes').addEventListener('click', function() {
            if (selectedNodes.length < 2) {
                alert('Select two nodes to connect.');
                return;
            }
            const node1 = selectedNodes[0];
            const node2 = selectedNodes[1];
            const line = createLine(node1, node2);
            document.getElementById('lines').appendChild(line);
            lines.push(line);
            selectedNodes.forEach(node => node.classList.remove('selected'));
            selectedNodes = [];
            saveHistory();
        });
    
        document.getElementById('exportMindMap').addEventListener('click', function() {
            renderMindMapToCanvas();
            downloadMindMapImage();
            alert('Mind Map exported!');
        });
    
        document.getElementById('undo').addEventListener('click', function() {
            if (history.length > 0) {
                const lastState = history.pop();
                redoStack.push(JSON.stringify(saveState()));
                restoreState(lastState);
            }
        });
    
        document.getElementById('redo').addEventListener('click', function() {
            if (redoStack.length > 0) {
                const nextState = redoStack.pop();
                history.push(JSON.stringify(saveState()));
                restoreState(nextState);
            }
        });
    
        function clearMindMap() {
            nodes.forEach(node => node.remove());
            nodes = [];
            lines.forEach(line => line.remove());
            lines = [];
            history = [];
            redoStack = [];
        }
    
        function deleteSelectedNodes() {
            selectedNodes.forEach(node => {
                const index = nodes.indexOf(node);
                if (index !== -1) {
                    nodes.splice(index, 1);
                }
                node.remove();
            });
    
            lines = lines.filter(line => {
                const parentNodeIds = selectedNodes.map(node => node.id);
                const lineNodeIds = [line.getAttribute('data-node1'), line.getAttribute('data-node2')];
                if (parentNodeIds.includes(lineNodeIds[0]) && parentNodeIds.includes(lineNodeIds[1])) {
                    return false;
                }
                return true;
            });
    
            selectedNodes = [];
        }
    
        function createNode(id, x, y) {
            const node = document.createElement('div');
            node.classList.add('node');
            node.setAttribute('id', id);
            node.setAttribute('contenteditable', 'true');
            node.style.left = x + 'px';
            node.style.top = y + 'px';
            node.innerText = id;
            node.addEventListener('mousedown', startDrag);
            node.addEventListener('click', selectNode);
            return node;
        }
    
        function createLine(node1, node2) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', node1.offsetLeft + node1.offsetWidth / 2);
            line.setAttribute('y1', node1.offsetTop + node1.offsetHeight / 2);
            line.setAttribute('x2', node2.offsetLeft + node2.offsetWidth / 2);
            line.setAttribute('y2', node2.offsetTop + node2.offsetHeight / 2);
            line.setAttribute('stroke', 'black');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('data-node1', node1.id);
            line.setAttribute('data-node2', node2.id);
            return line;
        }
    
        function saveState() {
            return {
                nodes: nodes.map(node => ({
                    id: node.id,
                    x: node.offsetLeft,
                    y: node.offsetTop,
                    text: node.innerText
                })),
                lines: lines.map(line => ({
                    x1: line.getAttribute('x1'),
                    y1: line.getAttribute('y1'),
                    x2: line.getAttribute('x2'),
                    y2: line.getAttribute('y2'),
                    node1: line.getAttribute('data-node1'),
                    node2: line.getAttribute('data-node2')
                }))
            };
        }
    
        function saveHistory() {
            history.push(JSON.stringify(saveState()));
            redoStack = [];
        }
    
        function restoreState(state) {
            clearMindMap();
            const savedState = JSON.parse(state);
            savedState.nodes.forEach(nodeData => {
                const node = createNode(nodeData.id, nodeData.x, nodeData.y);
                node.innerText = nodeData.text;
                document.getElementById('mindMapCanvas').appendChild(node);
                nodes.push(node);
            });
            savedState.lines.forEach(lineData => {
                const node1 = document.getElementById(lineData.node1);
                const node2 = document.getElementById(lineData.node2);
                const line = createLine(node1, node2);
                document.getElementById('lines').appendChild(line);
                lines.push(line);
            });
        }
    
        let draggedNode = null;
    
        function startDrag(event) {
            draggedNode = event.target;
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', endDrag);
        }
    
        function drag(event) {
            if (draggedNode) {
                const canvas = document.getElementById('mindMapCanvas');
                const rect = canvas.getBoundingClientRect();
                draggedNode.style.left = Math.min(Math.max(0, event.clientX - rect.left - draggedNode.offsetWidth / 2), rect.width - draggedNode.offsetWidth) + 'px';
                draggedNode.style.top = Math.min(Math.max(0, event.clientY - rect.top - draggedNode.offsetHeight / 2), rect.height - draggedNode.offsetHeight) + 'px';
                updateLines(draggedNode);
            }
        }
    
        function endDrag() {
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', endDrag);
            draggedNode = null;
            saveHistory();
        }
    
        function updateLines(node) {
            lines.forEach(line => {
                if (line.getAttribute('data-node1') === node.id || line.getAttribute('data-node2') === node.id) {
                    const node1 = document.getElementById(line.getAttribute('data-node1'));
                    const node2 = document.getElementById(line.getAttribute('data-node2'));
                    line.setAttribute('x1', node1.offsetLeft + node1.offsetWidth / 2);
                    line.setAttribute('y1', node1.offsetTop + node1.offsetHeight / 2);
                    line.setAttribute('x2', node2.offsetLeft + node2.offsetWidth / 2);
                    line.setAttribute('y2', node2.offsetTop + node2.offsetHeight / 2);
                }
            });
        }
    
        function selectNode(event) {
            const node = event.target;
            if (node.classList.contains('selected')) {
                node.classList.remove('selected');
                selectedNodes = selectedNodes.filter(n => n !== node);
            } else {
                if (selectedNodes.length < 2) {
                    node.classList.add('selected');
                    selectedNodes.push(node);
                }
            }
        }
    
        function renderMindMapToCanvas() {
    const canvas = document.getElementById('mindMapImageCanvas');
    const ctx = canvas.getContext('2d');
    const mindMapContainer = document.getElementById('mindMapCanvas');

    // Set canvas dimensions to match the mindMapContainer
    canvas.width = mindMapContainer.offsetWidth;
    canvas.height = mindMapContainer.offsetHeight;

    // Clear canvas and set background color
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lines first to ensure they appear behind nodes
    lines.forEach(line => {
        const node1 = document.getElementById(line.getAttribute('data-node1'));
        const node2 = document.getElementById(line.getAttribute('data-node2'));
        ctx.beginPath();
        ctx.moveTo(node1.offsetLeft + node1.offsetWidth / 2, node1.offsetTop + node1.offsetHeight / 2);
        ctx.lineTo(node2.offsetLeft + node2.offsetWidth / 2, node2.offsetTop + node2.offsetHeight / 2);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Draw nodes and their content
    nodes.forEach(node => {
        ctx.fillStyle = node.classList.contains('selected') ? 'lightgreen' : 'lightblue';
        ctx.fillRect(node.offsetLeft, node.offsetTop, node.offsetWidth, node.offsetHeight);

        // Draw text content inside the node
        ctx.font = '14px Arial';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.innerText, node.offsetLeft + node.offsetWidth / 2, node.offsetTop + node.offsetHeight / 2);
    });
}

    
        function downloadMindMapImage() {
    const canvas = document.getElementById('mindMapImageCanvas');
    canvas.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'mindmap.png';
    link.href = url;
    link.click();
}, 'image/png');
}