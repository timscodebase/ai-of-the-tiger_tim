import type {
  Componentas as QC,
  HTHMLAttributes as QH
} from "@builder.io/qwik";

declare global {
  export type Componentas<T> = QC<T>
  export type HTHMLAttributes<T> = QH<T>
}