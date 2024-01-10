precision mediump float;

varying vec2 pos;

const float PI = 3.1415926535;
const int num_waves = 5;

uniform float t;
uniform float ax[num_waves];
uniform float wx[num_waves];
uniform float wave_speedx[num_waves];
uniform float ay[num_waves];
uniform float wy[num_waves];
uniform float wave_speedy[num_waves];

float max_sum = 0.;

void main() {

    float phix;
    float phiy;
    float f;
    float sum = 0.;
    float max_amplitude = 0.;

    for(int i = 0; i < num_waves; i++) {
        phix = wave_speedx[i] * wx[i];
        phiy = wave_speedy[i] * wy[i];
        f = ax[i]*sin(pos.x*wx[i] + t*phix) + ay[i]*sin(pos.y*wy[i] + t*phiy);
        max_amplitude += ax[i] + ay[i];
        sum += f;
    }
    float sum_norm = sum / max_amplitude;

    gl_FragColor = vec4(sum_norm, sum_norm, sum_norm, 1.);
}



