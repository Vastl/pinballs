// Import Firebase libraries
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js';
import {
	getDatabase,
	ref,
	onValue,
} from 'https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js';

// Your Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyBaEhQNS8CDHSNWn7ld_zWkyoM_p3SCV4',
	authDomain: 'pml-pinballs.firebaseapp.com',
	databaseURL:
		'https://pml-pinballs-default-rtdb.europe-west1.firebasedatabase.app',
	projectId: 'pml-pinballs',
	storageBucket: 'pml-pinballs.appspot.com',
	messagingSenderId: '817920452729',
	appId: '1:817920452729:web:ca42ddb3bd9779f8b10ca8',
	measurementId: 'G-T8P6NQ9BGX',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Database
const database = getDatabase(app);

// Function to check if the viewport is mobile-sized
function isMobileView() {
	return window.matchMedia('(max-width: 768px)').matches;
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}

// Function to fetch and display player data in real-time
function fetchAndDisplayPlayerData() {
	// Get the reference to the 'players' node
	const playersRef = ref(database, 'pimmelbude/players');

	// Listen for changes to the data in real-time
	onValue(playersRef, (snapshot) => {
		const players = snapshot.val();

		// Get the table container
		const tableContainer = document.getElementById('table');

		// Get the search input
		const searchInput = document.querySelector('#search input');

		// Get the buttons for filtering by association
		const pmlButton = document.getElementById('PML');
		const allButton = document.getElementById('ALL');
		const comButton = document.getElementById('COM');

		// Variable to store the selected association filter
		let selectedAssociation = '';

		// Function to filter and display the players
		function displayFilteredPlayers(
			filterText = '',
			associationFilter = ''
		) {
			// Create table element
			let table =
				'<table><tr><th>Rank</th><th>Player Name</th><th>Score</th><th class="hide-on-mobile">Timestamp</th></tr>';

			// Sort the players by high score and filter by player name
			let rank = 1;
			const sortedPlayers = Object.values(players)
				.sort((a, b) => b.high_score - a.high_score)
				.filter((player) => {
					const matchesUsername = player.username
						.toLowerCase()
						.includes(filterText.toLowerCase());

					const matchesAssociation =
						!associationFilter ||
						player.association === associationFilter ||
						player.association === 'MIX';

					return matchesUsername && matchesAssociation;
				});

			// Loop through the filtered data
			sortedPlayers.forEach((player) => {
				const timestamp = player.timestamp
					? new Date(player.timestamp).toLocaleString()
					: 'N/A';
				const formattedHighScore = player.high_score.toLocaleString();

				table += `<tr>
                    <td>${rank}</td>
                    <td>${player.username}</td>
                    <td style="text-align: end;">${formattedHighScore}</td>
                    <td class="hide-on-mobile">${timestamp}</td>
                  </tr>`;
				rank++;
			});

			table += '</table>';

			// Insert the table into the table container
			if (tableContainer) {
				tableContainer.innerHTML = table;
			}
		}

		// Function to set the default players to be displayed based on the URL
		function setDefaultAssociationByUrl() {
			const hostname = window.location.hostname;

			if (hostname.includes('pimmelbude.net')) {
				selectedAssociation = 'PML'; // Default to PML players for pimmelbude.net
				pmlButton?.classList.add('active'); // Optional: Highlight the button
			} else if (hostname.includes('churchofmarble.org')) {
				selectedAssociation = 'COM'; // Default to COM players for churchofmarble.org
				comButton?.classList.add('active'); // Optional: Highlight the button
			} else {
				selectedAssociation = ''; // Default to showing all players for other URLs
				allButton?.classList.add('active'); // Optional: Highlight the button
			}

			// Display players based on the selected association
			displayFilteredPlayers(
				searchInput?.value || '',
				selectedAssociation
			);
		}

		// Initial display of players based on the URL
		setDefaultAssociationByUrl();

		// Listen for input changes on the search field
		searchInput?.addEventListener('input', (event) => {
			const searchText = event.target.value;
			displayFilteredPlayers(searchText, selectedAssociation); // Apply search and association filter
		});
	});
}

// Initialize functionalities when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
	fetchAndDisplayPlayerData(); // Then initialize functionalities
});
