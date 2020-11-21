const algorithmia = require('algorithmia');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd');

const watsonApiKey = require('../credentials/watson-nlu.json').apiKey
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
 
var nlu = new NaturalLanguageUnderstandingV1({
 iam_apikey: watsonApiKey,   
 version: '2018-04-05',
 url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
})

nlu.analyze({
    text: `Hi, I'm Michael Jackson and I like doing the moonwalk dance move`,
    features: {
        keywords: {}
    }
},(error, response) => {
    if (error) {
        throw error
    }
    console.log(JSON.stringify(response, null, 4));
    process.exit(0)
})

async function robot(content) {
    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContentIntoSentences(content)


    async function fetchContentFromWikipedia(content) {
        
        const algorithmiaAutenticated = algorithmia(algorithmiaApiKey);
        const wikipediaAlgorithm = algorithmiaAutenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm);
        const wikipediaContent = wikipediaResponde.get()
        
        content.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
        
        content.sourceContentSanitized = withoutDatesInParentheses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')
            
            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }
                return true
            })
            return withoutBlankLinesAndMarkdown.join(' ')
        }
    }
    function removeDatesInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }
    function breakContentIntoSentences(content) {
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }
        
}

module.exports = robot