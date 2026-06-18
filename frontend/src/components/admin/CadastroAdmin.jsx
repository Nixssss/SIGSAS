import useAdminViewport from "./useAdminViewport"
import CadastroAdminDesktop from "./CadastroAdminDesktop"
import CadastroAdminMobile from "./CadastroAdminMobile"

function CadastroAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <CadastroAdminMobile {...props} /> : <CadastroAdminDesktop {...props} />
}

export default CadastroAdmin
