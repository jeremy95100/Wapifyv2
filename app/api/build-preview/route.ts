import { NextRequest, NextResponse } from 'next/server'

interface BuildRequest {
  files: Array<{ path: string; content: string }>
  projectId: string
}

// Cache simple en mémoire
const buildCache = new Map<string, { html: string; timestamp: number }>()
const CACHE_DURATION = 30 * 1000 // 30 secondes (réduit pour faciliter les tests)

export async function POST(request: NextRequest) {
  try {
    const { files, projectId } = await request.json() as BuildRequest

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Vérifier le cache
    const cacheKey = projectId + '-' + JSON.stringify(files.map(f => f.path + f.content.length))
    const cached = buildCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('✅ Using cached build for project:', projectId)
      return NextResponse.json({ html: cached.html })
    }

    console.log('🔨 Building React project:', projectId, 'with', files.length, 'files')

    // Trouver les fichiers principaux
    const appFile = files.find(f => f.path === 'src/App.jsx' || f.path === 'App.jsx')
    const mainFile = files.find(f => f.path === 'src/main.jsx' || f.path === 'main.jsx' || f.path === 'src/index.jsx' || f.path === 'index.jsx')

    if (!appFile) {
      throw new Error('No App.jsx found')
    }

    // Extraire tous les composants (en excluant les fichiers de config)
    const componentFiles = files.filter(f =>
      (f.path.endsWith('.jsx') || f.path.endsWith('.js')) &&
      f.path !== 'src/main.jsx' &&
      f.path !== 'main.jsx' &&
      f.path !== 'src/index.jsx' &&
      f.path !== 'index.jsx' &&
      !f.path.includes('config') &&
      !f.path.includes('tailwind') &&
      !f.path.includes('postcss') &&
      !f.path.includes('vite') &&
      !f.path.includes('eslint') &&
      !f.path.includes('package')
    )

    // Extraire le CSS (enlever les directives Tailwind non compilées)
    const cssFiles = files.filter(f => f.path.endsWith('.css'))
    let allCss = cssFiles.map(f => {
      return f.content
        .replace(/@tailwind\s+[^;]+;/g, '') // Enlever @tailwind
        .replace(/@layer\s+[^{]+\{[\s\S]*?\}/g, '') // Enlever @layer
        .replace(/@apply\s+[^;]+;/g, '') // Enlever @apply
        .replace(/\/\*[\s\S]*?\*\//g, '') // Enlever commentaires
        .trim()
    }).join('\n')

    // Transformer le code JSX de tous les composants
    let allComponentsCode = ''
    const declaredNames = new Set()

    for (const file of componentFiles) {
      let code = file.content
        // Enlever les imports
        .replace(/import\s+.*?from\s+['"].*?['"];?\n?/g, '')
        // Enlever les export
        .replace(/export\s+default\s+/g, '')
        .replace(/export\s+\{[^}]+\}/g, '')
        .replace(/export\s+const\s+/g, 'const ')
        .replace(/export\s+function\s+/g, 'function ')
        // Enlever CommonJS exports
        .replace(/module\.exports\s*=\s*[^;]+;?/g, '')
        .replace(/exports\.\w+\s*=\s*[^;]+;?/g, '')
        // Remplacer import.meta.env par un objet vide (pour Vite)
        .replace(/import\.meta\.env\.\w+/g, '""')
        .replace(/import\.meta/g, '{}')
        .trim()

      // Détecter et garder trace des déclarations
      const hookMatches = code.match(/(?:const|function)\s+([A-Za-z_]\w*)\s*(?:=|\()/g)
      if (hookMatches) {
        for (const match of hookMatches) {
          const name = match.match(/(?:const|function)\s+([A-Za-z_]\w*)/)?.[1]
          if (name) {
            if (declaredNames.has(name)) {
              console.log(`⚠️ Duplicate declaration found: ${name} in ${file.path} - keeping first occurrence`)
              // Ne pas inclure ce fichier s'il redéclare exactement la même chose
              code = ''
              break
            }
            declaredNames.add(name)
          }
        }
      }

      // Toujours inclure le code des composants (sauf si détecté comme doublon exact)
      if (code && code.trim().length > 0) {
        allComponentsCode += `\n// ${file.path}\n${code}\n`
      }
    }

    // Créer le HTML final avec React CDN + Babel + Tailwind CDN
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview React</title>

  <!-- Tailwind CSS via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    ${allCss}
  </style>

  <!-- React + ReactDOM + Babel -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    console.log('🚀 React Preview: Starting...');
    const { useState, useEffect, useCallback, useMemo, useRef, useContext, createContext, useReducer, memo, forwardRef, useImperativeHandle, useLayoutEffect, useDebugValue, useId, useDeferredValue, useTransition, useSyncExternalStore } = React;

    // Mock Icon components - Mapping d'icônes courantes vers emojis
    const iconMap = {
      CheckSquare: '✅', Square: '⬜', Plus: '➕', Trash: '🗑️', Edit: '✏️',
      Check: '✓', X: '✕', Menu: '☰', Search: '🔍', User: '👤',
      LogOut: '🚪', Settings: '⚙️', Home: '🏠', ChevronDown: '▼',
      ChevronUp: '▲', ChevronRight: '▶', ChevronLeft: '◀',
      BarChart3: '📊', BarChart: '📊', PieChart: '📈', TrendingUp: '📈',
      Calendar: '📅', Clock: '🕐', Star: '⭐', Heart: '❤️',
      Send: '📤', Download: '⬇️', Upload: '⬆️', File: '📄',
      Folder: '📁', Image: '🖼️', Video: '🎥', Music: '🎵',
      Bell: '🔔', AlertCircle: '⚠️', Info: 'ℹ️', CheckCircle: '✅',
      XCircle: '❌', Filter: '🔽', Sort: '⇅', RefreshCw: '🔄',
      Loader: '⏳', Lock: '🔒', Unlock: '🔓', Eye: '👁️', EyeOff: '🙈',
      Mail: '📧', Phone: '📞', MapPin: '📍', Globe: '🌐',
      Share: '🔗', Link: '🔗', Copy: '📋', Clipboard: '📋',
      Save: '💾', Printer: '🖨️', Archive: '📦', Package: '📦',
      ShoppingCart: '🛒', CreditCard: '💳', DollarSign: '$',
      ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓'
    };

    // Créer dynamiquement tous les composants d'icônes
    Object.keys(iconMap).forEach(iconName => {
      window[iconName] = ({ className, ...props }) => (
        <span className={className} {...props} style={{ display: 'inline-block', marginRight: '4px' }}>
          {iconMap[iconName]}
        </span>
      );
    });

    // Note: On ne peut pas créer de fallback automatique pour les icônes
    // car ça casserait le Proxy natif de JavaScript

    // Mock React Router pour la preview (navigation simulée)
    const Router = ({ children }) => {
      console.log('🎭 Using mock Router for preview');
      return <>{children}</>;
    };
    const BrowserRouter = Router;
    const HashRouter = Router;
    const MemoryRouter = Router;
    const Routes = ({ children }) => <>{children}</>;
    const Route = ({ element, path, children }) => {
      // Afficher le premier élément ou children
      return element || children || null;
    };
    const Link = ({ to, children, className, ...props }) => (
      <a href={'#' + to} className={className} {...props} onClick={(e) => {
        e.preventDefault();
        console.log('🔗 Mock navigation to:', to);
      }}>
        {children}
      </a>
    );
    const NavLink = Link;
    const Navigate = ({ to }) => {
      console.log('🔀 Mock redirect to:', to);
      return null;
    };
    const useNavigate = () => (to) => console.log('🧭 Mock navigate to:', to);
    const useLocation = () => ({ pathname: '/', search: '', hash: '', state: null });
    const useParams = () => ({});
    const useSearchParams = () => [new URLSearchParams(), () => {}];
    const Outlet = () => null;

    // Mock Supabase pour la preview (données en mémoire, pas de vraie DB)
    const createClient = (url, key) => {
      console.log('🎭 Using mock Supabase client for preview');
      let mockData = {};

      return {
        from: (table) => {
          const query = {
            select: (columns = '*') => {
              console.log(\`📊 Mock SELECT \${columns} from \${table}\`);
              query._operation = 'select';
              return query;
            },
            insert: (data) => {
              console.log(\`✏️ Mock INSERT into \${table}\`, data);
              query._operation = 'insert';
              query._data = data;
              return query;
            },
            update: (data) => {
              console.log(\`📝 Mock UPDATE in \${table}\`, data);
              query._operation = 'update';
              query._data = data;
              return query;
            },
            delete: () => {
              console.log(\`🗑️ Mock DELETE from \${table}\`);
              query._operation = 'delete';
              return query;
            },
            eq: (column, value) => {
              console.log(\`🔍 Mock WHERE \${column} = \${value}\`);
              return query;
            },
            neq: (column, value) => query,
            gt: (column, value) => query,
            gte: (column, value) => query,
            lt: (column, value) => query,
            lte: (column, value) => query,
            like: (column, pattern) => query,
            ilike: (column, pattern) => query,
            in: (column, values) => query,
            contains: (column, value) => query,
            order: (column, options) => query,
            limit: (count) => query,
            range: (from, to) => query,
            single: () => {
              query._single = true;
              return query;
            },
            then: (resolve, reject) => {
              // Exécuter la requête
              if (!mockData[table]) mockData[table] = [];

              if (query._operation === 'insert') {
                const newData = Array.isArray(query._data) ? query._data : [query._data];
                newData.forEach(item => {
                  item.id = Date.now() + Math.random();
                  mockData[table].push(item);
                });
                return resolve({ data: newData, error: null });
              } else if (query._operation === 'update') {
                return resolve({ data: [query._data], error: null });
              } else if (query._operation === 'delete') {
                return resolve({ data: null, error: null });
              } else {
                // select
                const data = query._single ? mockData[table]?.[0] || null : mockData[table] || [];
                return resolve({ data, error: null });
              }
            }
          };
          return query;
        },
        auth: {
          getUser: async () => ({
            data: { user: { id: 'demo-user', email: 'demo@example.com' } },
            error: null
          }),
          getSession: async () => ({
            data: {
              session: {
                user: { id: 'demo-user', email: 'demo@example.com' },
                access_token: 'demo-token'
              }
            },
            error: null
          }),
          onAuthStateChange: (callback) => {
            console.log('🎭 Mock onAuthStateChange');
            // Simuler une session connectée
            setTimeout(() => {
              callback('SIGNED_IN', {
                user: { id: 'demo-user', email: 'demo@example.com' },
                access_token: 'demo-token'
              });
            }, 100);
            return { data: { subscription: { unsubscribe: () => {} } } };
          },
          signInWithPassword: async () => ({ data: { session: {}, user: {} }, error: null }),
          signUp: async () => ({ data: { session: {}, user: {} }, error: null }),
          signOut: async () => ({ error: null })
        }
      };
    };

    ${allComponentsCode}

    // Fallbacks pour composants manquants (si pas déjà définis)
    if (typeof LoadingSpinner === 'undefined') {
      const LoadingSpinner = ({ className, size }) => (
        <div className={className} style={{ display: 'inline-block' }}>⏳</div>
      );
      window.LoadingSpinner = LoadingSpinner;
    }

    // Vérifier que App existe
    if (typeof App === 'undefined') {
      console.error('❌ App component not found!');
      document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">Error: App component not found</div>';
    } else {
      console.log('✅ App component found, rendering...');
      try {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
        console.log('✅ React app rendered successfully!');
      } catch (error) {
        console.error('❌ Error rendering React app:', error);
        document.getElementById('root').innerHTML = '<div style="padding: 20px; color: red;">Error rendering: ' + error.message + '</div>';
      }
    }
  </script>
</body>
</html>`

    // Mettre en cache
    buildCache.set(cacheKey, { html, timestamp: Date.now() })

    console.log('✅ Build completed successfully for project:', projectId)

    return NextResponse.json({ html })

  } catch (error) {
    console.error('❌ Build error:', error)
    return NextResponse.json(
      {
        error: 'Build failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
