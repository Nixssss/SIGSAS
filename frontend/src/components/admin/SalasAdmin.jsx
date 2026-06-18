import useAdminViewport from "./useAdminViewport"
import SalasAdminDesktop from "./SalasAdminDesktop"
import SalasAdminMobile from "./SalasAdminMobile"

function SalasAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <SalasAdminMobile {...props} /> : <SalasAdminDesktop {...props} />
}

export default SalasAdmin
