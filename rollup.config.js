import typescript from '@rollup/plugin-typescript'

export default {
  input: './packages/vue/src/index.ts',
  output: [
    // 1. cjs -> commonjs规范
    // 2. esm -> 标准化模块规范
    {
      format: 'cjs',
      file: 'packages/vue/dist/vue3-mini.cjs.js',
    },
    {
      format: 'es',
      file: 'packages/vue/dist/vue3-mini.esm.js',
    },
  ],
  plugins: [
    typescript(),
  ],
}
