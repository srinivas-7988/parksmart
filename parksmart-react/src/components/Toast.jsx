import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toast } = useApp()
  return (
    <div className={`toast${toast.visible ? ' show' : ''}`} id="toast">
      <div className="t" id="toast-t">{toast.title}</div>
      <div className="m" id="toast-m">{toast.message}</div>
    </div>
  )
}
