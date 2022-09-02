import typescript from "@rollup/plugin-typescript"
import pkg from './package.json'
export default {
  input: './src/index.ts',
  output: [
    // 1. cjs -> commonjs规范
    // 2. esm -> 标准化模块规范
    {
      format: 'cjs',
      file: pkg.main
    },
    {
      format: 'es',
      file: pkg.module
    },
  ],
  plugins: [
    typescript()
  ]
}