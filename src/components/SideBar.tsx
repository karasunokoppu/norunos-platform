import React from "react";
// import { contents } from "../type";


const SideBar: React.FC = (

) => {
    const [isSideBarOpened, setIsSideBarOpened] = React.useState(true);
    const contents = ["To Do List", "Calender", "Notes", "Settings"];//TODO Sample contents[Content管理用の方とかを実装する]

    let mainCss = "bg-bg-primary h-svh border-r-2 border-r-white text-text-primary flex flex-col justify-content-center px-2 pb-2" + (isSideBarOpened ? " w-40" : " w-fit");
    let buttonCss = " h-10 w-full flex flex-row justify-start items-center hover:bg-bg-hover hover:text-text-secondary " + (isSideBarOpened ? "" : "px-0");

    return(
        <div className={mainCss}>
            <button className={buttonCss} onClick={() => setIsSideBarOpened(!isSideBarOpened)}>
                <div className="px-2">☰</div>
                <div>{isSideBarOpened ? "Button01" : ""}</div>
            </button>
            <div className="h-px w-full bg-bg-tertiary"></div>
            {contents.map((content, index) => (
                <button key={index} className={buttonCss}>
                    <div className="px-2">📄</div>
                    <div>{isSideBarOpened ? content : ""}</div>
                </button>
            ))}
        </div>
    )
}

export default SideBar;