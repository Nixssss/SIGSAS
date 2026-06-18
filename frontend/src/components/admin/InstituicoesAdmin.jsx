import useAdminViewport from "./useAdminViewport"
import InstituicoesAdminDesktop from "./InstituicoesAdminDesktop"
import InstituicoesAdminMobile from "./InstituicoesAdminMobile"

function InstituicoesAdmin(props) {
  const mobile = useAdminViewport()

  return mobile ? <InstituicoesAdminMobile {...props} /> : <InstituicoesAdminDesktop {...props} />
}

export default InstituicoesAdmin
