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

let i = 0;

function draw() {
  clear();
  myShader.setUniform("iResolution", [400, 400]);
  myShader.setUniform("iTime", i/60.0);
  rect(0, 0, width, height);
  i++;
}

