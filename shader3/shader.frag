precision mediump float;

varying vec2 pos;

uniform float millis;
uniform sampler2D background;

void main() {
  vec2 newPos = pos;
  newPos.y = 1. - newPos.y;

  newPos = newPos + (sin(newPos * 16.)/16.);
  vec4 col = texture2D(background, newPos);

  float avg = (col.r + col.g + col.b) / 3.;
  gl_FragColor = vec4(avg, avg, avg, 1.);
}



