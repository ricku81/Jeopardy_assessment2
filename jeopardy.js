// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];
catNum = 6;
questionNum = 5;

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds () {
	const res = await axios.get(`http://jservice.io/api/categories?count=100`);
	// filters out the ids with not enough clues_count
	const validIds = res.data.filter((val) => {
		return val.clues_count === questionNum;
	});
	let cats = _.sampleSize(validIds, catNum); // lodash method
	let catIds = _.map(cats, 'id'); // lodash method
	return catIds;
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */
async function getCategory (catId) {
	const res = await axios.get(`https://jservice.io/api/category?id=${catId}`);

	// filters out empty answers and questions from API
	const cluesData = res.data.clues.filter((val) => {
		return val.question !== '' && val.answer !== '';
	});

	// pick n number of random cluesData objects without duplicates
	const clues = _.sampleSize(cluesData, questionNum); // lodash method

	// create the clueArray using .map()
	let clueArray = clues.map((val) => {
		return {
			question : val.question,
			answer   : val.answer,
			showing  : null
		};
	});

	// return obj w/ title and clues if enough q's are provided
	if (clueArray.length === questionNum) {
		return {
			title : res.data.title,
			clues : clueArray
		};
	}
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable () {
	try {
		// retrieve catagory objects
		categories = [];
		for (let id of await getCategoryIds()) {
			categories.push(await getCategory(id));
		}

		// create and append header to #game using jQuery and for...of loop
		$('#game').append(`<table id='jeopardy'></table>`);
		$('#jeopardy').append(`<thead></thead>`);
		$('thead').append(`<tr id='categories'></tr>`);

		// create tbody content and append to #game with event listener
		$('#jeopardy').append('<tbody id="clues"></tbody>');
		$('#clues').on('click', handleClick);

		for (let cat of categories) {
			$('#categories').append(`<td><b>${cat.title}</b></td>`);
		}

		// create tr's with td's inside using loops
		for (let i = 0; i < questionNum; i++) {
			$('#clues').append(`<tr id='${i}'></tr>`);
			let catIdx = 0;
			for (let j = 0; j < catNum; j++) {
				$(`#${i}`).append(`<td class="${catIdx++}">?</td>`);
			}
		}
		// creates a smooth transition from loading animation
		hideLoadingView();
	} catch (error) {
		$('table').remove();
		fillTable();
	}
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

// i used a different method to solve without using .showing property
function handleClick (evt) {
	// use className and parentElement's id to select indexes inside data
	const currCat = evt.target.className;
	const clueIdx = evt.target.parentElement.getAttribute('id');
	const currQ = categories[currCat].clues[clueIdx].question;
	const currA = categories[currCat].clues[clueIdx].answer;

	if (evt.target.innerText === '?') {
		$(evt.target).text(`${currQ}`);
	}
	else {
		$(evt.target).text(`${currA}`);
		$(evt.target).css('background-color', '#28a200');
	}
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView () {
	$('#jeopardy').remove();
	$('#spinner').show();
	$('button').text('Loading...');
	$('button').off();
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView () {
	$('#spinner').hide();
	$('button').text('Reset!');
	$('button').on('click', setupAndStart);
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

function setupAndStart () {
	showLoadingView();

	setTimeout(function () {
		fillTable();
	}, 1000);
}

// create html base for window on load
$(window).on('load', () => {
	$('body').append(`
		<div id="game">
			<h1>Jeopardy!</h1>
			<button id="btn">Start!</button>
			<div id="spinner" style="display: none">
				<img src='https://www.ithink.co/images/lg.ajax-spinner-preloader.gif'>
			</div>
		</div>
	`);
	/** On click of start / restart button, set up game. */
	$('button').on('click', setupAndStart);
});
