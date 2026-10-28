import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { RepositoryPage } from '@/pages/RepositoryPage';
import { ArchitecturePage } from '@/pages/ArchitecturePage';
import { GraphPage } from '@/pages/GraphPage';
import { CodeIntelligencePage } from '@/pages/CodeIntelligencePage';
import { FutureModulePage } from '@/pages/FutureModulePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analyze" element={<AnalysisPage />} />
        <Route path="/repository" element={<RepositoryPage />} />
        <Route path="/repository/architecture" element={<ArchitecturePage />} />
        <Route path="/repository/graph" element={<GraphPage />} />
        <Route path="/repository/code" element={<CodeIntelligencePage />} />
        <Route path="/repository/:module" element={<FutureModulePage />} />
      </Routes>
    </Layout>
  );
}
