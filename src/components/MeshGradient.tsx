import { useMemo } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';

// WebView is only available on native — import lazily so web bundle doesn't choke
let WebView: any = null;
if (Platform.OS !== 'web') {
    WebView = require('react-native-webview').WebView;
}

const { width, height } = Dimensions.get('window');

interface MeshGradientProps {
    colors?: string[];
    speed?: number;
}

const MeshGradient: React.FC<MeshGradientProps> = ({ 
    colors: propColors, 
    speed: propSpeed 
}) => {
    const config = {
        colors: propColors || ['#0037b9ff', '#003682ff', '#010977c5', '#011653ff', '#02275bff'],
        speed: propSpeed || 2,
        horizontalPressure: 3,
        verticalPressure: 9,
        waveFrequencyX: 4,
        waveFrequencyY: 2,
        waveAmplitude: 1,
        shadows: 1,
        highlights: 2,
        colorBrightness: 2.2,
        colorSaturation: -1,
        backgroundColor: '#020202ff',
        backgroundAlpha: 1,
        grainScale: 2,
        grainIntensity: 0,
        grainSpeed: 1,
        resolution: 0.75,
    };

    const htmlContent = useMemo(() => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: ${config.backgroundColor}; }
        canvas { width: 100%; height: 100%; display: block; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const gl = canvas.getContext('webgl');
        if (!gl) {
            document.body.innerHTML = 'WebGL not supported';
        }

        const colors = ${JSON.stringify(config.colors.map(c => {
        const r = parseInt(c.slice(1, 3), 16) / 255;
        const g = parseInt(c.slice(3, 5), 16) / 255;
        const b = parseInt(c.slice(5, 7), 16) / 255;
        return [r, g, b];
    }))};

        const vsSource = \`
            attribute vec2 aPosition;
            varying vec2 vUv;
            void main() {
                vUv = aPosition * 0.5 + 0.5;
                gl_Position = vec4(aPosition, 0.0, 1.0);
            }
        \`;

        const fsSource = \`
            precision highp float;
            varying vec2 vUv;
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec3 uColors[5];
            
            // Simplex noise by Ashima Arts
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 uv = vUv;
                uv.x *= uResolution.x / uResolution.y;
                
                float time = uTime * ${config.speed.toFixed(2)};
                
                // Fluid dynamic distortion
                vec2 p = uv;
                p.x += snoise(uv * ${config.waveFrequencyX.toFixed(2)} + time * 0.05) * ${config.waveAmplitude.toFixed(2)} * 0.1;
                p.y += snoise(uv * ${config.waveFrequencyY.toFixed(2)} - time * 0.08) * ${config.waveAmplitude.toFixed(2)} * 0.1;
                
                float n1 = snoise(p * ${config.horizontalPressure.toFixed(2)} + time * 0.1);
                float n2 = snoise(p * ${config.verticalPressure.toFixed(2)} - time * 0.05);
                float n3 = snoise(p * 2.5 + time * 0.15);
                
                vec3 color = uColors[0];
                color = mix(color, uColors[1], smoothstep(-0.6, 0.6, n1));
                color = mix(color, uColors[2], smoothstep(-0.6, 0.6, n2));
                color = mix(color, uColors[3], smoothstep(-0.4, 0.8, n3));
                color = mix(color, uColors[4], smoothstep(0.0, 1.0, snoise(uv * 1.2 + time * 0.05)));

                // Color adjustments
                color *= ${config.colorBrightness.toFixed(2)};
                
                // Saturation Adjustment
                float gray = dot(color, vec3(0.299, 0.587, 0.114));
                color = mix(vec3(gray), color, 1.0 + ${config.colorSaturation.toFixed(2)});
                
                // Highlights and shadows
                float light = snoise(uv * 8.0 + time * 0.5) * 0.1;
                color += light * ${config.highlights.toFixed(2)} * 0.05;
                color -= light * ${config.shadows.toFixed(2)} * 0.05;

                // Grain (scaled and timed)
                if (${config.grainIntensity.toFixed(2)} > 0.0) {
                    float grain = fract(sin(dot(uv * ${config.grainScale.toFixed(2)} + time * ${config.grainSpeed.toFixed(2)}, vec2(12.9898, 78.233))) * 43758.5453);
                    color += (grain - 0.5) * ${config.grainIntensity.toFixed(2)};
                }

                gl_FragColor = vec4(clamp(color, 0.0, 1.0), ${config.backgroundAlpha.toFixed(2)});
            }
        \`;

        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        }

        const program = gl.createProgram();
        gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
        gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
        gl.linkProgram(program);
        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(program, 'uTime');
        const uResolution = gl.getUniformLocation(program, 'uResolution');
        const uColors = gl.getUniformLocation(program, 'uColors');

        function resize() {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr * ${config.resolution};
            canvas.height = window.innerHeight * dpr * ${config.resolution};
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
        window.addEventListener('resize', resize);
        resize();

        function render(time) {
            gl.uniform1f(uTime, time * 0.001);
            gl.uniform2f(uResolution, canvas.width, canvas.height);
            gl.uniform3fv(uColors, colors.flat());
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    </script>
</body>
</html>
    `, []);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {Platform.OS === 'web' ? (
                // On web: use a native <iframe> with srcdoc — works in all browsers
                //@ts-ignore
                <iframe
                    srcDoc={htmlContent}
                    style={{
                        position: 'absolute' as any,
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        pointerEvents: 'none',
                    }}
                    scrolling="no"
                    frameBorder="0"
                />
            ) : (
                // On native: use react-native-webview
                <WebView
                    source={{ html: htmlContent }}
                    style={styles.webview}
                    scrollEnabled={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});

export default MeshGradient;
