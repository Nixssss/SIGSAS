import Navbar from "../components/Navbar"

function Dashboard(){

  return(

    <>
      <Navbar/>

      <div className="dashboard">

        <h1>Bem-vindo ao Portal do Aluno</h1>

        <div className="cards">

          <div className="card">
            <h3>Matérias</h3>
            <p>5 disciplinas ativas</p>
          </div>

          <div className="card">
            <h3>Notas</h3>
            <p>Consultar desempenho</p>
          </div>

          <div className="card">
            <h3>Financeiro</h3>
            <p>Boletos e pagamentos</p>
          </div>

        </div>

      </div>
    </>
  )

}

export default Dashboard