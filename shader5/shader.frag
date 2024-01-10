/*
 * ORIGINAL AUTHORS LICENSE NOTICE:
 * "Seascape" by Alexander Alekseev aka TDM - 2014
 * License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
 * Contact: tdmaav@gmail.com
 * 
 * I have cut down the original authors full shader and commented to 
 * explain how some of it works
 */



precision mediump float;

uniform vec2 iResolution;
uniform float iTime;

const int NUM_STEPS = 8;
const float PI	 	= 3.141592;
const float EPSILON	= 1e-3;
#define EPSILON_NRM (0.1 / iResolution.x)
//#define AA

// sea
const int ITER_GEOMETRY = 3;
const int ITER_FRAGMENT = 5;
const float SEA_HEIGHT = 0.6;
const float SEA_CHOPPY = 4.0;
const float SEA_SPEED = 0.8;
const float SEA_FREQ = 0.16;
const vec3 SEA_BASE = vec3(0.0,0.09,0.18);
const vec3 SEA_WATER_COLOR = vec3(0.8,0.9,0.6)*0.6;
#define SEA_TIME (1.0 + iTime * SEA_SPEED)
const mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);

// math
mat3 fromEuler(vec3 ang) {
	vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
	m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
	m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
	return m;
}

float gradient_hash( vec2 p ) {
    // dot is for directionality, so sign of resulting components are correct
	float h = dot(p,vec2(127.1,311.7));	
    return fract(sin(h)*43758.5453123);
}

// A Perlin noise function to hide the periodicity of the underlying waves.
float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );	
	vec2 u = f*f*(3.0-2.0*f);
    return -1.0+2.0*mix( mix( gradient_hash( i + vec2(0.0,0.0) ), 
                     gradient_hash( i + vec2(1.0,0.0) ), u.x),
                mix( gradient_hash( i + vec2(0.0,1.0) ), 
                     gradient_hash( i + vec2(1.0,1.0) ), u.x), u.y);
}

/* Diffusion is the principle that a surface will appear better lit
 * when it is closer to perpendicular to the light source. 
 * The multiplication, addition, and ^p power returned are simple
 * parameters to adjust the practical effect. This method of diffusion
 * is a Lambertian Diffuse.
 */
float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
}

/* Specular reflections are at their brightest when the view 
 * vector aligns with the reflection vector off where the incident 
 * light vector hit. This is calculated by reflecting the eyeline
 * vector across the surface normal, then dotting with the light vector
 * to see how aligned it is, OR it can be calculated by adding the
 * eyeline vector and the light vector, then dotting with the surface
 * normal, which I find easier to understand. The dot product is then
 * clamped to the range [0, 1] (negative light values are nonsense).
 * The s variable raises this dot product value to the s power to
 * increase the intensity of the highlight. The technique implemented
 * here is the Blinn-Phong Specular.
 */
float specular(vec3 n,vec3 l,vec3 eye, float s) {    
    float nrm = 1.; //(s + 8.0) / (PI * 8.0);
    // return pow(max(dot(reflect(eye,n),l),0.0),s) * nrm;
    return pow(max(dot(eye + l, n), 0.0), s) * nrm;
}

// sky
vec3 getSkyColor(vec3 e) {
    e.y = (max(e.y,0.0)*0.8+0.2)*0.8;
    return vec3(pow(1.0-e.y,2.0), 1.0-e.y, 0.6+(1.0-e.y)*0.4) * 1.1;
}

// sea
float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);    
    vec2 wv = 1.0-abs(sin(uv));
    vec2 swv = abs(cos(uv));    
    wv = mix(wv,swv,wv);
    /* wv = (1-a)*a + a*b where:
     * a = 1 - abs(sin(uv)); b = abs(cos(uv));
     * This is a simple periodic wave function that looks nice!
     * The addition pow's and choppy allow for control of how
     * "pointy" the waves are.
     */

    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}

/* This function acts as a height map that evolves over time. 
 * p.y represents the height of the ocean surface.
 * https://www.desmos.com/3d/d4b4b46bed
 */
float map(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_GEOMETRY; i++) {        
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

float map_detailed(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_FRAGMENT; i++) {        
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        h += d * amp;        
    	uv *= octave_m; freq *= 1.9; amp *= 0.22;
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {  
    float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 1.0);
    fresnel = min(pow(fresnel,3.0), 0.5);
    
    vec3 reflected = getSkyColor(reflect(eye,n));    
    vec3 refracted = SEA_BASE + diffuse(n,l,80.0) * SEA_WATER_COLOR * 0.12; 
    
    vec3 color = mix(refracted,reflected,fresnel);
    
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18;
    
    color += vec3(specular(n,l,eye,60.0));
    
    return color;
}

// tracing
vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);    
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y;
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {  
    float tm = 0.0;
    float tx = 1000.0;    
    float hx = map(ori + dir * tx);
    if(hx > 0.0) {
        p = ori + dir * tx;
        return tx;   
    }
    float hm = map(ori + dir * tm);    
    float tmid = 0.0;
    for(int i = 0; i < NUM_STEPS; i++) {
        tmid = mix(tm,tx, hm/(hm-hx));                   
        p = ori + dir * tmid;                   
    	float hmid = map(p);
		if(hmid < 0.0) {
        	tx = tmid;
            hx = hmid;
        } else {
            tm = tmid;
            hm = hmid;
        }
    }
    return tmid;
}

vec3 getPixel(in vec2 coord) {    
    // Normalize to [-1, 1]
    vec2 uv = coord / iResolution.xy;
    uv = uv * 2.0 - 1.0;
        
    // ray
    // I don't yet understand the commented out fromEuler function.
    // When multiplied by it, the scene is given curvature.  

    // vec3 ang = vec3(sin(time*3.0)*0.1,sin(time)*0.2+0.3,time);  
    vec3 ori = vec3(0.0,3.5,0.0);
    vec3 dir = normalize(vec3(uv.xy,-2.0));
    dir.z += length(uv) * 0.14;
    dir = normalize(dir);// * fromEuler(ang);
    
    // tracing
    vec3 p;
    heightMapTracing(ori,dir,p);
    vec3 dist = p - ori;
    vec3 n = getNormal(p, dot(dist,dist) * EPSILON_NRM);
    vec3 light = normalize(vec3(0.0,1.0,0.8)); 
             
    // color
    return mix(
        getSkyColor(dir),
        getSeaColor(p,n,light,dir,dist),
    	pow(smoothstep(0.0,-0.02,dir.y),0.2));
}

// main
void main() {
	
// this is simple anti-aliasing that averages a 3x3 square of pixels
#ifdef AA
    vec3 color = vec3(0.0);
    for(int i = -1; i <= 1; i++) {
        for(int j = -1; j <= 1; j++) {
        	vec2 uv = gl_FragCoord.xy+vec2(i,j)/3.0;
    		color += getPixel(uv);
        }
    }
    color /= 9.0;
#else
    vec3 color = getPixel(gl_FragCoord.xy);
#endif
    
    // post
	gl_FragColor = vec4(pow(color,vec3(0.65)), 1.0);
}