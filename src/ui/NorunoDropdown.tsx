import type React from "react";
import { useEffect, useRef, useState } from "react";

interface DropdownOption {
	value: string;
	label: string;
}

interface NorunoDropdownProps {
	value: string;
	onChange: (value: string) => void;
	options: DropdownOption[];
	placeholder?: string;
}

const NorunoDropdown: React.FC<NorunoDropdownProps> = ({
	value,
	onChange,
	options,
	placeholder = "Select...",
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const selectedOption = options.find((opt) => opt.value === value);
	const displayText = selectedOption ? selectedOption.label : placeholder;

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
				setFocusedIndex(-1);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	// Keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) {
			if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
				e.preventDefault();
				setIsOpen(true);
				setFocusedIndex(0);
			}
			return;
		}

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setFocusedIndex((prev) =>
					prev < options.length - 1 ? prev + 1 : prev,
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
				break;
			case "Enter":
				e.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < options.length) {
					onChange(options[focusedIndex].value);
					setIsOpen(false);
					setFocusedIndex(-1);
				}
				break;
			case "Escape":
				e.preventDefault();
				setIsOpen(false);
				setFocusedIndex(-1);
				break;
		}
	};

	const handleOptionClick = (optionValue: string) => {
		onChange(optionValue);
		setIsOpen(false);
		setFocusedIndex(-1);
	};

	return (
		<div
			role="listbox"
			className="w-20 border-2 border-border-primary flex-1 bg-bg-active text-text-secondary"
			ref={dropdownRef}
			onKeyDown={handleKeyDown}
		>
			<button
				type="button"
				className={"w-full flex flex-row justify-center items-center gap-2"}
				onClick={() => setIsOpen(!isOpen)}
			>
				<span>{displayText}</span>
				<span className="text-sm">{isOpen ? "▲" : "▼"}</span>
			</button>

			{isOpen && (
				<div className="w-20 absolute z-1000 overflow-auto flex flex-col bg-bg-active">
					{options.map((option, index) => (
						<button
							type="button"
							key={option.value}
							className={
								option.label === displayText
									? "text-text-on-accent "
									: ""
							}
							onClick={() => handleOptionClick(option.value)}
							onMouseEnter={() => setFocusedIndex(index)}
						>
							{option.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

export default NorunoDropdown;
