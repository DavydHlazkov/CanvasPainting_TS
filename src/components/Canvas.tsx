import React, { Component } from "react";
import "./canvas.css";
import Line from "../model/Line";
import Circle from "../model/Circle";

export default class Canvas extends Component {
  state: any = {
    elements: [],
    drawing: false,
    isFirst: true,
    isDeleted: true,
    coordinate: [],
    isInter: false,
    beforeContex: [],
    startCollapse: false,
    canvas: null,
    context: null,
    beforeCollapse: [],
  };

  constructor(props: never) {
    super(props);
    this.state.canvasRef = React.createRef();
  }

  componentDidMount() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    this.setState({
      ...this.state,
      context: ctx,
    });
  }

  componentDidUpdate() {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, 1000, 600);
    ctx!.lineWidth = 2;
    ctx!.strokeStyle = "white";
    ctx!.fillStyle = "#F36363";

    this.state.elements.forEach((element: Line) => {
      ctx?.beginPath();
      ctx?.moveTo(element.x1, element.y1);
      ctx?.lineTo(element.x2, element.y2);

      ctx?.stroke();

      this.state.coordinate.forEach((cir: Circle) => {
        ctx?.beginPath();
        ctx?.arc(cir.x, cir.y, 10, 0, 2 * Math.PI);
        ctx?.fill();
        ctx?.stroke();
      });
    });
  }

  intersect = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
    event: any
  ) => {
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
      return false;
    }
    let denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denominator === 0) {
      return false;
    }
    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
      return false;
    }
    let x = x1 + ua * (x2 - x1);
    let y = y1 + ua * (y2 - y1);
    var p = { x: x, y: y };
    this.updateCoordinate(event, p);
  };

  handleClick = (event: any) => {
    if (this.state.isFirst === true) {
      let nexX = event.clientX;
      let newY = event.clientY;
      let newElement = {
        x1: nexX,
        y1: newY,
        x2: event.clientX,
        y2: event.clientY,
      };
      this.setState({
        ...this.state,
        elements: [...this.state.elements, newElement],
        isFirst: false,
        drawing: true,
        isDeleted: false,
        coordinate: [...this.state.coordinate, []],
        startCollapse: false,
      });
      return;
    } else {
      const index = this.state.elements.length - 1;
      let nexX = event.clientX;
      let newY = event.clientY;
      let x2 = this.state.elements[index].x1;
      let y2 = this.state.elements[index].y1;
      let newElement = { x1: nexX, y1: newY, x2: x2, y2: y2 };
      this.setState({
        ...this.state,
        elements: [...this.state.elements, newElement],
        isFirst: true,
        drawing: false,
        isDeleted: true,
      });
      return;
    }
  };

  updateCoordinate = (event: any, p: Circle) => {
    const { clientX, clientY } = event;
    const index = this.state.elements.length - 1;
    const { x1, y1 } = this.state.elements[index];
    const updatedElement = { x1: x1, y1: y1, x2: clientX, y2: clientY };
    const elementCopy = [...this.state.elements];
    elementCopy[index] = updatedElement;
    if (p === undefined) {
      this.setState({
        ...this.state,
        elements: elementCopy,
      });
    } else {
      this.setState({
        ...this.state,
        elements: elementCopy,
        coordinate: [...this.state.coordinate.slice(0, -1), p],
      });
    }
  };

  handleMouseMove = (event: any): void => {
    if (this.state.drawing === false) return;
    this.setState({
      ...this.state,
      coordinate: [],
    });

    this.updateCoordinate(event, this.state.coordinate);
    if (this.state.elements.length >= 2) {
      for (let i = 0; i < this.state.elements.length; i++) {
        for (let j = 0; j < this.state.elements.length; j++) {
          if (i !== j) {
            this.intersect(
              this.state.elements[i].x1,
              this.state.elements[i].y1,
              this.state.elements[i].x2,
              this.state.elements[i].y2,
              this.state.elements[j].x1,
              this.state.elements[j].y1,
              this.state.elements[j].x2,
              this.state.elements[j].y2,
              event
            );
          }
        }
      }
    }
  };

  onContextMenuHandler = (event: any) => {
    event.preventDefault();
    if (!this.state.isDeleted) {
      let deleted = [...this.state.elements];
      deleted.pop();

      this.setState({
        ...this.state,
        isDeleted: true,
        isFirst: true,
        elements: deleted,
        drawing: false,
        coordinate: this.state.coordinate.slice(0, -1),
      });
    }
  };

  getMiddle = (line: Line) => {
    let res = {
      x: (line.x1 + line.x2) / 2,
      y: (line.y1 + line.y2) / 2,
    };
    return res;
  };

  getLength = (x1: number, y1: number, x2: number, y2: number) => {
    let length = {
      xLength: Math.abs(x2 - x1),
      yLength: Math.abs(y2 - y1),
    };
    return length;
  };

  collapseLines = (value: boolean) => {
    if (value === true) {
      const getHalfLine = (line: Line) => {
        let middleX = this.getMiddle(line).x;
        let middleY = this.getMiddle(line).y;
        let halfX =
          this.getLength(line.x1, line.y1, middleX, middleY).xLength / 10;
        let halfY =
          this.getLength(line.x1, line.y1, middleX, middleY).yLength / 10;

        let newLineX1 = line.x1 < line.x2 ? line.x1 + halfX : line.x1 - halfX;
        let newLineY1 = line.y1 < line.y2 ? line.y1 + halfY : line.y1 - halfY;
        let newLineX2 = line.x2 < line.x1 ? line.x2 + halfX : line.x2 - halfX;
        let newLineY2 = line.y2 < line.y1 ? line.y2 + halfY : line.y2 - halfY;
        this.setState({
          ...this.state,
          elements: [
            ...this.state.elements.slice(0, -1),
            // { x1: newLineX1, y1: newLineY1, x2: newLineX2, y2: newLineY2 },
          ],
          coordinate: [...this.state.coordinate.slice(0, -1)],
        });
      };
      this.state.elements.forEach((el: Line) => getHalfLine(el));
    }
  };

  onClickCollapse = () => {
    this.setState({
      ...this.state,
      startCollapse: true,
    });
    setInterval(() => this.collapseLines(this.state.startCollapse), 200);
  };

  render() {
    return (
      <div className="container">
        <canvas
          id="canvas"
          style={{
            backgroundColor: "#52B9B3",
          }}
          width={"1000px"}
          height={"600px"}
          onClick={this.handleClick}
          onMouseMove={this.handleMouseMove}
          onContextMenu={this.onContextMenuHandler}
        ></canvas>
        <div className="button-container">
          <button onClick={this.onClickCollapse}> Delete lines</button>
        </div>
      </div>
    );
  }
}
