const SearchBar = ({ value, onChange, placeholder='Search...' }) => {
  return (
    <div className="input-group mb-3">
      <input className="form-control" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} />
      <button className="btn btn-outline-secondary" onClick={e=>{ e.preventDefault(); onChange('') }}>Clear</button>
    </div>
  )
}

export default SearchBar
