import useAdminViewport from "./useAdminViewport"
import CampiAdminDesktop from "./CampiAdminDesktop"
import CampiAdminMobile from "./CampiAdminMobile"

function CampiAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <CampiAdminMobile {...props} /> : <CampiAdminDesktop {...props} />
}

export default CampiAdmin
