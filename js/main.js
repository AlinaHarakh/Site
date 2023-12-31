document.addEventListener("DOMContentLoaded", function () {
	const buttons = document.querySelectorAll(".category-btn, .tag-btn");
	const infoText = document.querySelector(".info__text");
	const midColumn = document.querySelector(".mid-column");
	const prevButton = document.querySelector(".info__prev");
	const nextButton = document.querySelector(".info__next");
	let currentIndex = 0;
	let items = [];
	let currentFilter = '';
	let currentPage = window.location.href.includes("new.html") ? 2 : 1;
	midColumn.style.display = "none";

	buttons.forEach(function (button) {
		button.addEventListener("click", function () {
			infoText.innerHTML = "";

			if (items.length >= 0) {
				midColumn.style.display = "flex";
				midColumn.scrollIntoView({ behavior: 'smooth' });
			}
			if (button.classList.contains('category-btn')) {
				currentFilter = 'category';
			} else {
				currentFilter = 'tag';
			}
			const clickedButtonId = button.id;
			const dataKey = button.classList.contains('category-btn') ? 'category' : 'tag';
			if (button.classList.contains('tag-btn')) {
				items = [];
				let selectedTag = TAGS[clickedButtonId];

				for (let i = 0; i < selectedTag.length; i++) {
					items[i] = document.getElementById(selectedTag[i]);
				}
			}
			else {
				items = Array.from(document.querySelectorAll(`[data-${dataKey}="${clickedButtonId}"]`));
			}

			infoText.innerHTML = "";
			let buttonsDisplay = items.length > 1 ? 'block' : 'none';
			prevButton.style.display = buttonsDisplay;
			nextButton.style.display = buttonsDisplay;
			if (items.length > 0) {
				currentFilter === 'category' ? currentIndex = Math.floor(Math.random() * items.length) : currentIndex = 0;
				appendItem(currentPage);
				midColumn.style.display = "flex";
			}
		});
	});

	prevButton.addEventListener("click", function () {
		if (items.length > 0 && currentIndex > 0) {
			currentIndex--;
		} else if (currentFilter === 'tag' && currentIndex == 0) {
			return false;
		} else if (items.length > 0) {
			currentIndex = items.length - 1;
		}
		infoText.innerHTML = "";
		appendItem(currentPage);
	});
	nextButton.addEventListener("click", function () {
		if (items.length > 0 && currentIndex < items.length - 1) {
			currentIndex++;
		} else if (currentFilter === 'tag' && currentIndex === items.length - 1) {
			return false;
		} else if (items.length > 0) {
			currentIndex = 0;
		}
		infoText.innerHTML = "";
		appendItem(currentPage);
	});

	const homeImages = "./images/home/";
	const newImages = "./images/new/";
	const imagesCache = {};

	function appendItem(currentPage) {

		const selectedItem = items[currentIndex].cloneNode(true);
		const id = selectedItem.getAttribute('id');
		errors = 0;
		const ps = selectedItem.querySelectorAll('p');
		for (const p of ps) {
			p.style.display = 'none';
		}

		if (!imagesCache[id]) {
			const img = new Image();
			img.src = (currentPage === 1 ? homeImages : newImages).concat(id, ".png");

			img.classList.add('img-content');
			img.style.display = 'none';

			img.onload = () => {
				img.style.display = 'block';
				imagesCache[id] = img;
				const ps = selectedItem.querySelectorAll('p');
				for (const p of ps) {
					p.style.display = 'none';
				}
			};

			img.onerror = () => {
				const imgJPG = new Image();
				imgJPG.src = (currentPage === 1 ? homeImages : newImages).concat(id, ".jpg");
				imgJPG.classList.add('img-content');
				imgJPG.style.display = 'none';

				imgJPG.onload = () => {
					imgJPG.style.display = 'block';
					imagesCache[id] = imgJPG;
					const ps = selectedItem.querySelectorAll('p');
					for (const p of ps) {
						p.style.display = 'none';
					}
				};

				imgJPG.onerror = () => {
					for (const p of ps) {
						p.style.display = 'block';
					}
				}
				selectedItem.appendChild(imgJPG);
			}
			selectedItem.appendChild(img);
		} else {
			selectedItem.appendChild(imagesCache[id]);
		}

		infoText.appendChild(selectedItem);
	}
});
let TAGS = {};
(function () {
	function excelToJson(filePath) {
		return new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("GET", filePath, true);
			xhr.responseType = "arraybuffer";
			xhr.onload = function (e) {
				const data = new Uint8Array(xhr.response);
				const workbook = XLSX.read(data, { type: "array" });
				const worksheet = workbook.Sheets[workbook.SheetNames[0]];
				const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
				resolve(json);
			};
			xhr.onerror = function (e) {
				reject(e);
			};
			xhr.send();
		});
	}

	const currentPage = window.location.href.includes("new.html") ? 2 : 1;
	const homeXlsx = "./texts_fin.xlsx";
	const homeTxt = "./stich_finale.txt";
	const newXlsx = "./texts_fin-new.xlsx";
	const newTxt = "./stich_finale-new.txt";
	const textDocumentPath = currentPage === 1 ? homeTxt : newTxt;
	const xlsxDocumentPath = currentPage === 1 ? homeXlsx : newXlsx;
	excelToJson(xlsxDocumentPath)
		.then((jsonData) => {
			const items = document.getElementById("items");
			jsonData.forEach((row) => {
				const li = document.createElement("li");
				li.id = row[0];
				li.setAttribute("data-category", row[1]);
				let content = "";
				for (let i = 2; i < row.length; i++) {
					content += `<p class="text-content">${row[i]}</p>`;
				}
				li.innerHTML = content;
				items.appendChild(li);
			});
			return fetchTags();
		})
		.then((tags) => {
			for (const tag of tags) {
				const ids = tag.content[0].split(", ");
				TAGS[tag.name] = ids;
				for (const id of ids) {
					const item = document.getElementById(id);
					if (item) {
						item.setAttribute("data-tag", tag.name);
					}
				}
			}
		})
		.catch((error) => {
			console.log("Error loading texts_fin.xlsx:", error);
		});
	function fetchTags() {
		return new Promise((resolve, reject) => {
			fetch(textDocumentPath)
				.then((response) => {
					if (!response.ok) {
						console.log("Error loading stich_finale.txt:", response.status);
					}
					return response.text();
				})
				.then((text) => {
					const lines = text.split("\n");
					const arrayMap = new Map();
					lines.forEach((line) => {
						const words = line.trim().split(" ");
						const arrayName = String(words[0]).toLowerCase();
						const arrayContent = words.slice(1).join(" ");
						if (!arrayMap.has(arrayName)) {
							arrayMap.set(arrayName, []);
						}
						arrayMap.get(arrayName).push(arrayContent);
					});
					const resultArray = Array.from(arrayMap, ([name, content]) => ({
						name,
						content,
					}));
					resolve(resultArray);
				})
				.catch((error) => {
					console.log("Error loading stich_finale.txt:", error);
				});
		});
	}
})();