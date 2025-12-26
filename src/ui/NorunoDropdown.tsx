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
			className="h-fit w-fit rounded-md border border-border-secondary bg-bg-primary px-2 py-1"
			ref={dropdownRef}
			onKeyDown={handleKeyDown}
		>
			<button
				type="button"
				className={!isOpen ? "" : "border-border-primary border-b"}
				onClick={() => setIsOpen(!isOpen)}
			>
				<span>{displayText}</span>
				<span className="pl-1 text-sm">{isOpen ? "▲" : "▼"}</span>
			</button>

			{isOpen && (
				<div className="flex flex-col divide-y divide-solid divide-border-primary">
					{options.map((option, index) => (
						<button
							type="button"
							key={option.value}
							className={
								option.label === displayText
									? "m-1 bg-bg-active hover:bg-bg-hover"
									: "m-1 bg-bg-primary hover:bg-bg-hover"
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
