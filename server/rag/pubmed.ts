import axios from 'axios';
import { PubMedQuery, PubMedResult } from './schemas';

/**
 * PubMed Integration Module
 * Provides clinical reasoning and evidence-based support for interventions
 * Uses NCBI E-utilities API for PubMed searches
 */

const NCBI_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const NCBI_API_KEY = process.env.NCBI_API_KEY; // Optional, increases rate limit

/**
 * Search PubMed for clinical evidence
 */
export async function searchPubMed(query: PubMedQuery): Promise<PubMedResult[]> {
  try {
    // Build search query
    const searchQuery = buildSearchQuery(query);
    
    // Search for article IDs
    const searchResponse = await axios.get(`${NCBI_BASE_URL}/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: searchQuery,
        retmax: query.limit,
        retmode: 'json',
        sort: 'relevance',
        api_key: NCBI_API_KEY,
      },
      timeout: 10000,
    });

    const searchData = searchResponse.data;
    if (!searchData.esearchresult || !searchData.esearchresult.idlist) {
      return [];
    }

    const articleIds = searchData.esearchresult.idlist;
    if (articleIds.length === 0) {
      return [];
    }

    // Fetch article details
    const articles = await fetchArticleDetails(articleIds);
    
    // Filter and rank by relevance
    const rankedArticles = rankArticlesByRelevance(articles, query);
    
    return rankedArticles.slice(0, query.limit);

  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

/**
 * Build search query string
 */
function buildSearchQuery(query: PubMedQuery): string {
  let searchTerms = [];
  
  // Add intervention terms
  searchTerms.push(`"${query.intervention}"[Title/Abstract]`);
  
  // Add case type terms
  if (query.caseType) {
    const caseTerms = query.caseType.split('-').join(' ');
    searchTerms.push(`"${caseTerms}"[Title/Abstract]`);
  }
  
  // Add age group filters
  if (query.ageGroup) {
    const ageFilters = getAgeGroupFilters(query.ageGroup);
    searchTerms.push(`(${ageFilters.join(' OR ')})`);
  }
  
  // Add pediatric filters
  searchTerms.push('("pediatric"[Title/Abstract] OR "child"[Title/Abstract] OR "infant"[Title/Abstract])');
  
  // Add clinical filters
  searchTerms.push('("emergency"[Title/Abstract] OR "critical"[Title/Abstract] OR "acute"[Title/Abstract])');
  
  // Add publication date filter (last 10 years)
  const currentYear = new Date().getFullYear();
  searchTerms.push(`"${currentYear - 10}":"${currentYear}"[Date - Publication]`);
  
  return searchTerms.join(' AND ');
}

/**
 * Get age group specific search filters
 */
function getAgeGroupFilters(ageGroup: string): string[] {
  switch (ageGroup) {
    case 'neonatal':
      return ['"neonatal"[Title/Abstract]', '"newborn"[Title/Abstract]', '"0-28 days"[Title/Abstract]'];
    case 'infant':
      return ['"infant"[Title/Abstract]', '"1-12 months"[Title/Abstract]', '"toddler"[Title/Abstract]'];
    case 'child':
      return ['"child"[Title/Abstract]', '"2-12 years"[Title/Abstract]', '"school age"[Title/Abstract]'];
    case 'adolescent':
      return ['"adolescent"[Title/Abstract]', '"teen"[Title/Abstract]', '"13-18 years"[Title/Abstract]'];
    default:
      return ['"pediatric"[Title/Abstract]'];
  }
}

/**
 * Fetch detailed article information
 */
async function fetchArticleDetails(articleIds: string[]): Promise<any[]> {
  try {
    const response = await axios.get(`${NCBI_BASE_URL}/efetch.fcgi`, {
      params: {
        db: 'pubmed',
        id: articleIds.join(','),
        retmode: 'xml',
        rettype: 'abstract',
        api_key: NCBI_API_KEY,
      },
      timeout: 15000,
    });

    // Parse XML response (simplified parsing)
    const articles = parsePubMedXML(response.data);
    return articles;

  } catch (error) {
    console.error('Error fetching article details:', error);
    return [];
  }
}

/**
 * Parse PubMed XML response (simplified)
 */
function parsePubMedXML(xmlData: string): any[] {
  const articles: any[] = [];
  
  try {
    // Simple regex-based parsing (in production, use proper XML parser)
    const articleMatches = xmlData.match(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g);
    
    if (!articleMatches) {
      return [];
    }
    
    articleMatches.forEach(articleXml => {
      const article = parseSingleArticle(articleXml);
      if (article) {
        articles.push(article);
      }
    });
    
  } catch (error) {
    console.error('Error parsing PubMed XML:', error);
  }
  
  return articles;
}

/**
 * Parse single article XML
 */
function parseSingleArticle(articleXml: string): any | null {
  try {
    // Extract title
    const titleMatch = articleXml.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract abstract
    const abstractMatch = articleXml.match(/<AbstractText>([^<]+)<\/AbstractText>/);
    const abstract = abstractMatch ? abstractMatch[1] : '';
    
    // Extract authors
    const authorMatches = articleXml.match(/<LastName>([^<]+)<\/LastName>/g);
    const authors = authorMatches ? authorMatches.map(m => m.replace(/<\/?LastName>/g, '')) : [];
    
    // Extract journal
    const journalMatch = articleXml.match(/<Journal>([^<]+)<\/Journal>/);
    const journal = journalMatch ? journalMatch[1] : '';
    
    // Extract publication date
    const dateMatch = articleXml.match(/<PubDate>([^<]+)<\/PubDate>/);
    const pubDate = dateMatch ? dateMatch[1] : '';
    
    // Extract DOI
    const doiMatch = articleXml.match(/<ELocationID[^>]*>([^<]+)<\/ELocationID>/);
    const doi = doiMatch ? doiMatch[1] : '';
    
    if (!title || !abstract) {
      return null;
    }
    
    return {
      title: title.trim(),
      abstract: abstract.trim(),
      authors: authors.slice(0, 5), // Limit to first 5 authors
      journal: journal.trim(),
      pubDate: pubDate.trim(),
      doi: doi.trim(),
    };
    
  } catch (error) {
    console.error('Error parsing single article:', error);
    return null;
  }
}

/**
 * Rank articles by relevance to the query
 */
function rankArticlesByRelevance(articles: any[], query: PubMedQuery): PubMedResult[] {
  return articles.map(article => {
    let relevanceScore = 0;
    
    // Title relevance
    const titleLower = article.title.toLowerCase();
    const interventionLower = query.intervention.toLowerCase();
    if (titleLower.includes(interventionLower)) {
      relevanceScore += 0.4;
    }
    
    // Abstract relevance
    const abstractLower = article.abstract.toLowerCase();
    if (abstractLower.includes(interventionLower)) {
      relevanceScore += 0.3;
    }
    
    // Case type relevance
    if (query.caseType) {
      const caseTerms = query.caseType.split('-').join(' ');
      if (titleLower.includes(caseTerms) || abstractLower.includes(caseTerms)) {
        relevanceScore += 0.2;
    }
    }
    
    // Age group relevance
    if (query.ageGroup) {
      const ageTerms = getAgeGroupTerms(query.ageGroup);
      if (ageTerms.some(term => 
        titleLower.includes(term) || abstractLower.includes(term)
      )) {
        relevanceScore += 0.1;
      }
    }
    
    // Recency bonus (newer articles get slight boost)
    const currentYear = new Date().getFullYear();
    const pubYear = parseInt(article.pubDate) || currentYear;
    if (currentYear - pubYear <= 5) {
      relevanceScore += 0.05;
    }
    
    return {
      ...article,
      relevanceScore: Math.min(relevanceScore, 1.0), // Cap at 1.0
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Get age group terms for relevance scoring
 */
function getAgeGroupTerms(ageGroup: string): string[] {
  switch (ageGroup) {
    case 'neonatal':
      return ['neonatal', 'newborn', '0-28 days'];
    case 'infant':
      return ['infant', '1-12 months', 'toddler'];
    case 'child':
      return ['child', '2-12 years', 'school age'];
    case 'adolescent':
      return ['adolescent', 'teen', '13-18 years'];
    default:
      return ['pediatric'];
  }
}

/**
 * Get clinical reasoning summary for an intervention
 */
export async function getClinicalReasoningSummary(
  intervention: string,
  caseType: string,
  ageGroup?: string
): Promise<string> {
  try {
    const results = await searchPubMed({
      intervention,
      caseType,
      ageGroup: ageGroup as "neonatal" | "infant" | "child" | "adolescent" | undefined,
      limit: 3,
    });
    
    if (results.length === 0) {
      return "Limited clinical evidence available for this intervention.";
    }
    
    // Create a concise clinical reasoning summary
    const summary = results.map(result => {
      const keyPoints = extractKeyClinicalPoints(result.abstract);
      return `${result.title}: ${keyPoints}`;
    }).join(' | ');
    
    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
    
  } catch (error) {
    console.error('Error getting clinical reasoning summary:', error);
    return "Unable to retrieve clinical evidence at this time.";
  }
}

/**
 * Extract key clinical points from abstract
 */
function extractKeyClinicalPoints(abstract: string): string {
  // Look for key clinical phrases
  const clinicalPhrases = [
    'effective', 'safe', 'recommended', 'indicated', 'contraindicated',
    'benefit', 'risk', 'outcome', 'survival', 'mortality',
    'complication', 'adverse', 'side effect'
  ];
  
  const sentences = abstract.split(/[.!?]+/);
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase();
    return clinicalPhrases.some(phrase => lowerSentence.includes(phrase));
  });
  
  if (relevantSentences.length === 0) {
    return abstract.substring(0, 100) + '...';
  }
  
  return relevantSentences[0].trim();
}


