import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';


interface PluginMetadata {
  num_downloads: string;
}

interface Plugin {
  id: string;
  content: string;
  chunk_html: string;
  link: string;
  metadata: PluginMetadata;
}

const demoSearchQueries = [
  "Optimize Canvas Connections",
  "Canvas Presentation",
  "Typewriter Scroll",
  "Review",
  "TagFolder",
  "Recipe view",
  "Hider",
  "Chat with Bard",
];

const defaultSearchQuery = demoSearchQueries[Math.floor(Math.random() * demoSearchQueries.length)];

type SearchType = "semantic" | "hybrid" | "fulltext";

function App() {
  const [searchTerm, setSearchTerm] = useState<string>(defaultSearchQuery);
  const [searchType, setSearchType] = useState<SearchType>('semantic');
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const observer = useRef<IntersectionObserver>();
  const lastPluginElementRef = useCallback((node: Element | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  async function fetchPlugins(query: string = '', currentPage: number = 1) {
    setLoading(true);

    const requestBody = {
      query,
      search_type: searchType,
      page: currentPage,
      page_size: 30,
    };

    console.log("Request Body:", requestBody);

    try {
      const response = await fetch("https://api.trieve.ai/api/chunk/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TR-Organization": import.meta.env.VITE_ORG_API,
          "TR-Dataset": import.meta.env.VITE_DATASET_API,
          Authorization: import.meta.env.VITE_API,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response Data:", data);
      setPlugins(prevPlugins => [
        ...prevPlugins,
        ...data.score_chunks.map((chunk: any) => ({
          ...chunk.metadata[0],
          num_downloads: chunk.metadata[0].metadata.num_downloads,
        })),
      ]);
      setHasMore(data.score_chunks.length > 0);
    } catch (error) {
      console.error("Failed to fetch plugins:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlugins(searchTerm, page);
  }, [searchTerm, page, searchType]);

  return (
    <>
    <div className='flex-row text-center'>
      <h1 className='text-5xl'>Trieve Search for Obsidian Plugins</h1>
      <p className='mt-6 mb-6  font-medium tag'>Explore Obsidian plugins made by the community.</p>
      <div className='flex relative justify-center'>
      <input
        className='w-3/5 h-11 rounded-full pl-4 border border-slate-500 search'
        type='text'
        placeholder='Search plugins...'
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPlugins([]);
          setPage(1);
        }}
        
      />
      <div className='mb-4 absolute main'>
        <select value={searchType} onChange={(e) => setSearchType(e.target.value as SearchType)} className='mb-4, p-2
         text-white h-11 rounded-e-full option border border-slate-500'>
          <option value="semantic">Semantic</option>
          <option value="hybrid">Hybrid</option>
          <option value="fulltext">Fulltext</option>
        </select>
      </div>
      </div>
      </div>
      <div className='flex justify-center flex-wrap'>
        {loading && plugins.length === 0 ? (
          <p>Loading...</p>
        ) : (
          plugins.map((plugin, index) => (
            <div ref={plugins.length === index + 1 ? lastPluginElementRef : null} key={plugin.id || index.toString()} className="mt-4 p-6 rounded-lg w-96 mr-2 container">
              <div className='header' dangerouslySetInnerHTML={{ __html: plugin.chunk_html }} />
              <p className="text-sm text-stone-400 pt-2">{plugin.metadata.num_downloads}</p>
              <a href={plugin.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">Learn more</a>
            </div>
          ))
        )}
        
      </div>
    </>
  );
}

export default App;
