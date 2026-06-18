import useAdminViewport from "./useAdminViewport"
import UsuariosAdminDesktop from "./UsuariosAdminDesktop"
import UsuariosAdminMobile from "./UsuariosAdminMobile"

function UsuariosAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <UsuariosAdminMobile {...props} /> : <UsuariosAdminDesktop {...props} />
}

export default UsuariosAdmin
