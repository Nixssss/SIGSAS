import useAdminViewport from "./useAdminViewport"
import ReservasAdminDesktop from "./ReservasAdminDesktop"
import ReservasAdminMobile from "./ReservasAdminMobile"

function ReservasAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <ReservasAdminMobile {...props} /> : <ReservasAdminDesktop {...props} />
}

export default ReservasAdmin
