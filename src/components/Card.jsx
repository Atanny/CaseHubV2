import { cls } from '../utils/cls';

/** Generic white rounded panel used for page sections throughout the app. */
export default function Card({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={cls('bg-white rounded-ch-lg shadow-ch p-5', className)} {...rest}>
      {children}
    </Tag>
  );
}
