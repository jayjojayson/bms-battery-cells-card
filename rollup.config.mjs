import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/bms-battery-cells-card.js',
  output: {
    file: 'dist/bms-battery-cells-card.js',
    format: 'es'
  },
  plugins: [
    resolve(),
    commonjs({
      include: [/node_modules/, /src\/chart\.umd\.min\.js/]
    })
  ]
};
