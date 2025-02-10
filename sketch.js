let grid = [];
let cols, rows;
let size = 15;
let threshold;
let flashInterval = 30;
let stopSimulation = false;
let restartButton;

let handPose;
let video;
let hands = [];
let options = { flipped: true };

let calmMusic;
let alertMusic;

let serial;
let isWashing = false;

function preload() {
  console.log("Loading assets...");
  handPose = ml5.handPose({ flipped: true });

  calmMusic = loadSound(
    "calm.wav",
    () => console.log("✅ Calm music loaded!"),
    () => console.error("❌ Failed to load calm.wav")
  );

  alertMusic = loadSound(
    "alert.wav",
    () => console.log("✅ Alert music loaded!"),
    () => console.error("❌ Failed to load alert.mp3")
  );
}

function setup() {
  createCanvas(960, 720);
  video = createCapture(VIDEO, { flipped: true });
  video.size(960, 720);
  video.hide();
  handPose.detectStart(video, gotHands);

  //   let button = createButton("restart");
  //   button.mousePressed(restart);

  cols = floor(width / size);
  rows = floor(height / size);

  //   if (!window.p5 || !p5.SerialPort) {
  //     console.error("p5.serialport is not loaded! Check your index.html.");
  //     return;
  //   }

  //   serial = new p5.SerialPort();
  //   serial.list();
  //   serial.open("/dev/tty.usbmodem14201"); // ✅ Update with your correct port!
  //   serial.on("data", gotData);

  threshold = floor(rows * (3 / 6));

  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0;
    }
  }

  restartButton = createButton("⏳ RESTART");
  restartButton.position(20, 20);
  restartButton.style("font-size", "16px");
  restartButton.style("border-radius", "8px");
  restartButton.style("padding", "10px 20px");
  restartButton.style("background-color", "#001f3f");
  restartButton.style("border", "2px solid #00ccff");
  restartButton.style("color", "#00ccff");
  restartButton.style("font-family", "'Orbitron', sans-serif");
  restartButton.style("text-transform", "uppercase");
  restartButton.style("letter-spacing", "2px");
  restartButton.style("box-shadow", "0 0 10px #00ccff");
  restartButton.mousePressed(restartSimulation);
  restartButton.hide();
  calmMusic.loop();
}

// function gotData() {
//   let data = serial.readLine().trim();
//   console.log("Received:", data); // Debugging output

//   if (data.toUpperCase() === "START") {
//     isWashing = true; // Start moving
//   } else if (data.toUpperCase() === "STOP") {
//     isWashing = false; // Stop moving
//   }
// }

function draw() {
  background(10, 10, 15);
  image(video, 0, 0, width, height);

  //   if (isWashing) {
  if (!stopSimulation) {
    for (let i = 0; i < hands.length; i++) {
      let hand = hands[i];
      let indexFinger = hand.keypoints[12];
      addWater(indexFinger.x, indexFinger.y);
    }
  }
  //   }

  drawRect();

  let filledCount = 0;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] > 0) {
        filledCount++;
      }
    }
  }

  if (filledCount >= cols * rows * (3 / 6)) {
    if (!stopSimulation) {
      stopSimulation = true;
      restartButton.show();
      calmMusic.stop();
      alertMusic.loop();
    }
  }

  if (!stopSimulation) {
    let nextGrid = [];
    for (let i = 0; i < cols; i++) {
      nextGrid[i] = [];
      for (let j = 0; j < rows; j++) {
        nextGrid[i][j] = 0;
      }
    }

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        let state = grid[i][j];
        if (state > 0) {
          if (j + 1 < rows) {
            let below = grid[i][j + 1];
            let dir = random() < 0.5 ? 1 : -1;
            let belowDiag =
              i + dir >= 0 && i + dir < cols ? grid[i + dir][j + 1] : null;

            if (below == 0) {
              nextGrid[i][j + 1] = state;
            } else if (belowDiag == 0) {
              nextGrid[i + dir][j + 1] = state;
            } else {
              nextGrid[i][j] = state;
            }
          } else {
            nextGrid[i][j] = state;
          }
        }
      }
    }

    grid = nextGrid;
  }
}

// function mousePressed() {
//   if (getAudioContext().state !== "running") {
//     getAudioContext().resume();
//   }
//   let fs = fullscreen();
//   fullscreen(!fs);
// }

function drawRect() {
  let isFlashing =
    stopSimulation && frameCount % flashInterval < flashInterval / 2;

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      if (grid[i][j] > 0) {
        noStroke();
        if (stopSimulation) {
          fill(isFlashing ? color(255, 50, 50) : color(255, 0, 0));
          ellipse(i * size + size / 2, j * size + size / 2, size, size);
          fill(isFlashing ? color(255, 255, 100) : color(255, 255, 0));
          ellipse(i * size + size / 2, j * size + size / 2, size / 2, size / 2);
        } else {
          fill(0, 191, 255, grid[i][j]);
          ellipse(i * size + size / 2, j * size + size / 2, size, size);
          fill(255, 255, 255, 200);
          ellipse(i * size + size / 2, j * size + size / 2, size / 2, size / 2);
        }
      }
    }
  }
}

function addWater(fingerX, fingerY) {
  if (!stopSimulation) {
    let x = floor(fingerX / size);
    let y = floor(fingerY / size);
    x = constrain(x, 0, cols - 1);
    y = constrain(y, 0, rows - 1);
    grid[x][y] = (frameCount % 205) + 50;
  }
}

function restartSimulation() {
  stopSimulation = false;
  restartButton.hide();

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      grid[i][j] = 0;
    }
  }

  alertMusic.stop();
  calmMusic.loop();
}

function gotHands(results) {
  hands = results;
}

// function restart() {
//   clear();
// }
