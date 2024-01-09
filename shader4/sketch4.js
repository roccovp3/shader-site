let myShader;
const numCircles = 100;
const circles = [];
const colorVec = [];

// load in the shader
function preload() {
  myShader = loadShader('shader.vert', 'shader.frag');
}

function setup() {
  createCanvas(400, 400, WEBGL);
  
  // tell p5 to use the shader
  shader(myShader);

  noStroke();

  for(let i = 0; i < numCircles; i++) {
    circles.push(random(), random(), random(0.05, 0.01));
  }
  myShader.setUniform("circles", circles);

  colorVec.push(random(), random(), random());
  myShader.setUniform("color_vec", colorVec);
}


function draw() {
  clear();  
  rect(0, 0, width, height);
}

