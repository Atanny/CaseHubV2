import { cls } from '@/utils/classNames'

export function Toast({ msg, type }) {
  if(!msg) return null;
  return <div className={cls("toast", type||"success")}>{msg}</div>;
}
