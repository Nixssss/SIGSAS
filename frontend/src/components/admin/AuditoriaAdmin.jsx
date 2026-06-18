import useAdminViewport from "./useAdminViewport"
import AuditoriaAdminDesktop from "./AuditoriaAdminDesktop"
import AuditoriaAdminMobile from "./AuditoriaAdminMobile"

function AuditoriaAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <AuditoriaAdminMobile {...props} /> : <AuditoriaAdminDesktop {...props} />
}

export default AuditoriaAdmin
