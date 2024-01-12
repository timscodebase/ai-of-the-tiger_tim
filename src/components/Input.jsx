import { component$ } from "@builder.io/qwik";
import { randomString } from "~/utils";

/**
 * @typedef {HTMLAttributes<HTMLTextAreaElement>} TextareaAttributes
 */

/**
 * @type {Component<TextareaAttributes  & {
 * label: string,
 * name: string,
 * id?: string,
 * value?: string
 * }>}
 */
export default component$(({id, label, value, ...props}) => {
  const id = id || randomString(8)

  return (
    <label class= "w-1/2 flex flex-col text-neutral-100" for={id}>{label}<textarea class="p-4 text-neutral-800" id={id} {...props}>{value}</textarea>
    </label>
  )
})