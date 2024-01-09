let myShader;

// load in the shader
function preload() {
  myShader = loadShader('shader.vert', 'shader.frag');
  backgroundImage = loadImage('utexas.png')
}

function setup() {
  createCanvas(400, 400, WEBGL);
  
  // tell p5 to use the shader
  shader(myShader);

  noStroke();
}

function draw() {
  clear();
  myShader.setUniform("background", backgroundImage); 
  myShader.setUniform("millis", millis());
  rect(0, 0, width, height);
}

