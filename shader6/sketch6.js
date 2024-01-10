let myShader;

// load in the shader
function preload() {
  myShader = loadShader('shader.vert', 'shader.frag');
}

function setup() {
  createCanvas(400, 400, WEBGL);
  
  // tell p5 to use the shader
  shader(myShader);

  noStroke();

}

let frame = 0;

function draw() {
  clear();
  myShader.setUniform("t", frame);
  myShader.setUniform("ax", [1,2,4,8,16]);
  myShader.setUniform("wx", [170, 110, 130, 70, 40]);
  myShader.setUniform("wave_speedx", [0.001, 0.002, 0.003, 0.004, 0.005]);
  myShader.setUniform("ay", [1,2,4,8,16]);
  myShader.setUniform("wy", [17, 11, 13, 7, 6]);
  myShader.setUniform("wave_speedy", [0.0005, 0.001, 0.0006, 0.0008, 0.001]);
  rect(0, 0, width, height);
  frame++;
}

