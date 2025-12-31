import React from "react";
import { Subtask } from "../../type";

interface SubTaskCardProps {
    subtasks: Subtask[];
    isOpened: boolean;
}

const SubTaskCard: React.FC<SubTaskCardProps> = ({
    subtasks,
    isOpened,
}) => {
    return(
        <div>
            {isOpened && (
                <div>
                    {subtasks.map((subtask: Subtask) => (
                    <div>
                        <input type="checkbox" checked={subtask.completed}/>
                        <label>{subtask.description}</label>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
}

export default SubTaskCard;