import ts from 'rollup-plugin-ts'

export default {
  input: 'src/index.ts',
  output: {
    file: 'lib/index.js',
    format: 'cjs'
  },
  plugins: [
    ts({
    })
  ]
}
