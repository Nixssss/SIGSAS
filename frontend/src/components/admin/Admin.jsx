import useAdminViewport from "./useAdminViewport"
import AdminDesktop from "./AdminDesktop"
import AdminMobile from "./AdminMobile"

function Admin({ adminTela }) {
  const mobile = useAdminViewport()

  return mobile ? (
    <AdminMobile adminTela={adminTela} />
  ) : (
    <AdminDesktop adminTela={adminTela} />
  )
}

export default Admin
