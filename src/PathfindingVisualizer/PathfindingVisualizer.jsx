import React, { Component } from 'react';
import Node from './Node/Node';
import { dijkstra, getNodesInShortestPathOrder } from '../algorithm/dijkstra';
import '@fortawesome/fontawesome-free/css/all.css';
import './PathfindingVisualizer.css';
import { Bounce, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from 'react-modal'; // Import react-modal
import './Modal.css';
import image from './d.png';

let START_NODE_ROW;
let START_NODE_COL;
let FINISH_NODE_ROW;
let FINISH_NODE_COL;

// Helper function to calculate grid dimensions based on the window size
const calculateGridDimensions = () => {
  // const nodeSize = 39; // This should match the width and height of your .node CSS class
  const width = window.innerWidth;
  const height = window.innerHeight;

  const cols = Math.floor(width / 30);
  const rows = Math.floor(height / 40);

  START_NODE_ROW = 1;
  START_NODE_COL = 1;
  FINISH_NODE_ROW = rows - 2;
  FINISH_NODE_COL = cols - 2;

  return { rows, cols };
};

// Helper function to create the initial grid
const getInitialGrid = (rows, cols) => {
  const grid = [];
  for (let row = 0; row < rows; row++) {
    const currentRow = [];
    for (let col = 0; col < cols; col++) {
      currentRow.push(createNode(col, row));
    }
    grid.push(currentRow);
  }
  return grid;
};

const createNode = (col, row) => {
  return {
    col,
    row,
    isStart: row === START_NODE_ROW && col === START_NODE_COL,
    isFinish: row === FINISH_NODE_ROW && col === FINISH_NODE_COL,
    distance: Infinity,
    isVisited: false,
    isWall: false,
    previousNode: null,
  };
};

const getNewGridWithWallToggled = (grid, row, col) => {
  const newGrid = grid.slice();
  const node = newGrid[row][col];
  if (!node.isStart && !node.isFinish) {
    const newNode = {
      ...node,
      isWall: !node.isWall,
    };
    newGrid[row][col] = newNode;
  }
  return newGrid;
};

export default class PathfindingVisualizer extends Component {
  constructor() {
    super();
    this.state = {
      grid: [],
      mouseIsPressed: false,
      startNodeRowInput: '',
      startNodeColInput: '',
      finishNodeRowInput: '',
      finishNodeColInput: '',
      rows: 0,
      cols: 0,
      resultMessage: '', // New state variable to store the result message
      modalIsOpen: true, // State variable to control modal visibility
    };
  }

  componentDidMount() {
    const { rows, cols } = calculateGridDimensions();
    const grid = getInitialGrid(rows, cols);
    this.setState({ grid, rows, cols });
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    const { rows, cols } = calculateGridDimensions();
    const grid = getInitialGrid(rows, cols);
    this.setState({ grid, rows, cols });
  }

  handleMouseDown(row, col) {
    const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
    this.setState({ grid: newGrid, mouseIsPressed: true });
  }

  handleMouseEnter(row, col) {
    if (!this.state.mouseIsPressed) return;
    const newGrid = getNewGridWithWallToggled(this.state.grid, row, col);
    this.setState({ grid: newGrid });
  }

  handleMouseUp() {
    this.setState({ mouseIsPressed: false });
  }

  animateDijkstra(visitedNodesInOrder, nodesInShortestPathOrder) {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          this.animateShortestPath(nodesInShortestPathOrder);
        }, 10 * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        document.getElementById(`node-${node.row}-${node.col}`).className =
          'node node-visited';
      }, 10 * i);
    }
  }

  animateShortestPath(nodesInShortestPathOrder) {
    if (nodesInShortestPathOrder.length === 1) {
      // If only the start node is in the path, it means the finish node is unreachable from the start node
      this.displayResultMessage(0, false);
      return;
    }
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        document.getElementById(`node-${node.row}-${node.col}`).className =
          'node node-shortest-path';
      }, 50 * i);
    }
    // Display result message after the animation is complete
    setTimeout(() => {
      this.displayResultMessage(nodesInShortestPathOrder.length, true);
    }, 50 * nodesInShortestPathOrder.length);
  }

  displayResultMessage = (pathLength, success) => {
    const endTime = performance.now();
    const duration = endTime - this.startTime;
    if (success) {
      const resultMessage = `Dijkstra's Algorithm completed in ${duration.toFixed(2)} ms; 
        Shortest path length: ${pathLength} units;
        Source Node: (${START_NODE_ROW}, ${START_NODE_COL});
        Finish Node: (${FINISH_NODE_ROW}, ${FINISH_NODE_COL})`;
      toast.success(resultMessage);
    }
    else {
      const resultMessage = `Dijkstra's Algorithm completed in ${duration.toFixed(2)} ms; 
        The finish node (${FINISH_NODE_ROW}, ${FINISH_NODE_COL}) is unreachable from the start node (${START_NODE_ROW}, ${START_NODE_COL}).`;
      toast.warning(resultMessage);
    }
  }
  visualizeDijkstra() {
    const { grid } = this.state;
    const startNode = grid[START_NODE_ROW][START_NODE_COL];
    const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];
    this.startTime = performance.now(); // Start timing the algorithm
    const visitedNodesInOrder = dijkstra(grid, startNode, finishNode);
    const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode);
    this.animateDijkstra(visitedNodesInOrder, nodesInShortestPathOrder);
  }

  resetGrid() {
    const { rows, cols } = calculateGridDimensions();
    const grid = getInitialGrid(rows, cols);
    this.setState({
      grid,
      mouseIsPressed: false,
      startNodeRowInput: '',
      startNodeColInput: '',
      finishNodeRowInput: '',
      finishNodeColInput: '',
      resultMessage: '', // Clear result message on reset
    }, () => {
      this.clearNodeClasses();
    });
  }

  clearNodeClasses() {
    const { grid } = this.state;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const node = grid[row][col];
        let nodeClassName = 'node';
        if (node.isStart) {
          nodeClassName = 'node node-start';
        } else if (node.isFinish) {
          nodeClassName = 'node node-finish';
        }
        document.getElementById(`node-${node.row}-${node.col}`).className = nodeClassName;
      }
    }
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    const numValue = parseInt(value, 10);
    if (numValue >= 0 && (name.includes("Row") ? numValue < this.state.rows : numValue < this.state.cols)) {
      this.setState({ [name]: value });
    }
  }

  setStartAndFinishNodes = () => {
    const { startNodeRowInput, startNodeColInput, finishNodeRowInput, finishNodeColInput, rows, cols } = this.state;

    const startRow = startNodeRowInput ? parseInt(startNodeRowInput) : 1;
    const startCol = startNodeColInput ? parseInt(startNodeColInput) : 1;
    const finishRow = finishNodeRowInput ? parseInt(finishNodeRowInput) : rows - 2;
    const finishCol = finishNodeColInput ? parseInt(finishNodeColInput) : cols - 2;

    if (startRow === finishRow && startCol === finishCol) {
      // alert('To ensure a valid flow, the source and destination nodes cannot coincide.');
      toast.error('To ensure a valid flow, the source and destination nodes cannot coincide.');
      return;
    }

    START_NODE_ROW = startRow;
    START_NODE_COL = startCol;
    FINISH_NODE_ROW = finishRow;
    FINISH_NODE_COL = finishCol;

    const grid = getInitialGrid(rows, cols);
    this.setState({ grid });
  }

  // Method to close the modal
  closeModal = () => {
    this.setState({ modalIsOpen: false });
  };

  render() {
    const { grid, mouseIsPressed, startNodeRowInput, startNodeColInput, finishNodeRowInput, finishNodeColInput, rows, cols, modalIsOpen } = this.state;

    return (
      <>
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={this.closeModal}
          contentLabel="Welcome Modal"
          className="Modal"
          overlayClassName="Overlay"
        >
          <div className="modal-content">
            <button className="close-button" onClick={this.closeModal}><i class="fa-sharp fa-solid fa-rectangle-xmark"></i></button>
            <h2>Welcome, pathfinders!👋</h2>
            <img src={image} alt="Pathfin-D-er" width={'30%'} height={'30%'}/>
            <ul>
              <li>Ever get lost in a maze of decisions? Well, ditch the crumb trail!🪄</li>
              <li><b>"Pathfin-D-er"</b> is your personal cartographer for the digital age.🗺️</li>
              <li>Imagine a world of grids, where you get to be the architect.🧭</li>
              <li>Click and drag to build walls🧱, then drop the start and finish flags.🏳️</li>
              <li>With a click of a button👆, watch Dijkstra's Algorithm come alive, weaving a glowing path through your maze like a neon breadcrumb trail.🛣️</li>
              <li>Explore the logic behind the magic, one step at a time. Let's get finding!🔍</li>
            </ul>
          </div>
        </Modal>
        <div className="inputs">
          <input
            type="number"
            name="startNodeRowInput"
            placeholder="Start-X"
            value={startNodeRowInput}
            min="0"
            max={rows - 1}
            onChange={this.handleInputChange}
          />
          <input
            type="number"
            name="startNodeColInput"
            placeholder="Start-Y"
            value={startNodeColInput}
            min="0"
            max={cols - 1}
            onChange={this.handleInputChange}
          />
          <input
            type="number"
            name="finishNodeRowInput"
            placeholder="Finish-X"
            value={finishNodeRowInput}
            min="0"
            max={rows - 1}
            onChange={this.handleInputChange}
          />
          <input
            type="number"
            name="finishNodeColInput"
            placeholder="Finish-Y"
            value={finishNodeColInput}
            min="0"
            max={cols - 1}
            onChange={this.handleInputChange}
          />
          <button onClick={this.setStartAndFinishNodes}>
            <span className="circle1"></span>
            <span className="circle2"></span>
            <span className="circle3"></span>
            <span className="circle4"></span>
            <span className="circle5"></span>
            <span className="text">Set Start & Finish Nodes<i className="fa-solid fa-sliders" style={{ marginLeft: '5px' }}></i></span>
          </button>
        </div>

        <div className="grid">
          {grid.map((row, rowIdx) => {
            return (
              <div key={rowIdx}>
                {row.map((node, nodeIdx) => {
                  const { row, col, isFinish, isStart, isWall } = node;
                  return (
                    <Node
                      key={nodeIdx}
                      col={col}
                      isFinish={isFinish}
                      isStart={isStart}
                      isWall={isWall}
                      mouseIsPressed={mouseIsPressed}
                      onMouseDown={(row, col) => this.handleMouseDown(row, col)}
                      onMouseEnter={(row, col) =>
                        this.handleMouseEnter(row, col)
                      }
                      onMouseUp={() => this.handleMouseUp()}
                      row={row}></Node>
                  );
                })}
              </div>
            );
          })}
        </div>
        <button onClick={() => this.visualizeDijkstra()}>
          <span className="circle1"></span>
          <span className="circle2"></span>
          <span className="circle3"></span>
          <span className="circle4"></span>
          <span className="circle5"></span>
          <span className="text">Visualize Shortest Path<i className="fa-solid fa-circle-play" style={{ marginLeft: '5px' }}></i></span>
        </button>
        <button onClick={() => this.resetGrid()}>
          <span className="circle1"></span>
          <span className="circle2"></span>
          <span className="circle3"></span>
          <span className="circle4"></span>
          <span className="circle5"></span>
          <span className="text">Reset Grid Structure<i className="fa-solid fa-repeat" style={{ marginLeft: '5px' }}></i></span>
        </button>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Bounce}
        />
      </>
    );
  }
}