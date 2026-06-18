import useAdminViewport from "./useAdminViewport"
import AdminResumoDesktop from "./AdminResumoDesktop"
import AdminResumoMobile from "./AdminResumoMobile"

function AdminResumo(props) {
  const mobile = useAdminViewport()

  return mobile ? <AdminResumoMobile {...props} /> : <AdminResumoDesktop {...props} />
}

export default AdminResumo
