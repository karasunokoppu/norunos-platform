import "./App.css";
import MainField from "./components/MainField";
import SideBar from "./components/SideBar";

function App() {

  return (
    <main className="flex flex-row">
      <SideBar />
      <MainField />
    </main>
  );
}

export default App;
