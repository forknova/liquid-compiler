import {join} from 'path';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import {defineConfig} from 'rollup';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import pkg from './package.json' assert {type: 'json'};

const config = [
  defineConfig({
    input: join('src', 'index.ts'),
    treeshake: {
      propertyReadSideEffects: false,
    },
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        freeze: false,
        exports: 'named',
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
        freeze: false,
        exports: 'named',
      },
    ],
    plugins: [
      del({targets: join('dist')}),
      resolve(),
      commonjs(),
      json(),
      typescript({tsconfig: './tsconfig.json'}),
    ],
    external: [],
    watch: {
      include: 'src/**',
    },
  }),
  {
    input: join('dist', 'types', 'src', 'index.d.ts'),
    output: [
      {
        file: pkg.types,
        format: 'es',
      },
    ],
    plugins: [dts(), del({targets: join('dist', 'types'), hook: 'buildEnd'})],
  },
];

export default config;
