import useAdminViewport from "./useAdminViewport"
import AdminBuscaDesktop from "./AdminBuscaDesktop"
import AdminBuscaMobile from "./AdminBuscaMobile"

function AdminBusca(props) {
  const mobile = useAdminViewport()

  return mobile ? <AdminBuscaMobile {...props} /> : <AdminBuscaDesktop {...props} />
}

export default AdminBusca
