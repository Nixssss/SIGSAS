import { useState, useEffect } from "react"

function Salas(){

  const [salas,setSalas] = useState([])
  const [nome,setNome] = useState("")
  const [editId,setEditId] = useState(null)

  useEffect(()=>{
    const dados = JSON.parse(localStorage.getItem("salas")) || []
    setSalas(dados)
  },[])

  useEffect(()=>{
    localStorage.setItem("salas", JSON.stringify(salas))
  },[salas])

  function salvar(e){
    e.preventDefault()

    if(editId){
      setSalas(salas.map(s =>
        s.id === editId ? {...s,nome} : s
      ))
      setEditId(null)
    }else{
      setSalas([...salas,{id:Date.now(),nome}])
    }

    setNome("")
  }

  function excluir(id){
    setSalas(salas.filter(s=>s.id!==id))
  }

  function editar(sala){
    setNome(sala.nome)
    setEditId(sala.id)
  }

  return(
    <div>

      <div className="card">
        <form onSubmit={salvar}>
          <input
            value={nome}
            onChange={(e)=>setNome(e.target.value)}
            placeholder="Nome da sala"
            required
          />
          <button className="btn primary">
            {editId ? "Atualizar" : "Adicionar"}
          </button>
        </form>
      </div>

      {salas.map(s=>(
        <div className="card" key={s.id}>
          <p>{s.nome}</p>

          <button className="btn edit" onClick={()=>editar(s)}>
            Editar
          </button>

          <button className="btn delete" onClick={()=>excluir(s.id)}>
            Excluir
          </button>
        </div>
      ))}

    </div>
  )
}

export default Salas