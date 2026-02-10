import { useNavigate } from 'react-router';
import { MessageCircle, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchHighlight } from './SearchHighlight';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface SessionResult {
  id: string;
  name: string;
  metadata?: {
    workingDir?: string;
  };
  createdAt: string;
}

interface MessageResult {
  id: string;
  sessionId: string;
  sessionName: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

interface SearchResultsProps {
  searchQuery: string;
  sessionResults: SessionResult[];
  messageResults: MessageResult[];
  isLoading?: boolean;
}

export function SearchResults({
  searchQuery,
  sessionResults,
  messageResults,
  isLoading,
}: SearchResultsProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded">
              <div className="h-10 w-10 bg-muted rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const hasResults = sessionResults.length > 0 || messageResults.length > 0;

  if (!hasResults && searchQuery) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">未找到匹配结果,尝试其他关键词</p>
      </Card>
    );
  }

  if (!hasResults && !searchQuery) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">输入关键词开始搜索</p>
      </Card>
    );
  }

  const totalCount = sessionResults.length + messageResults.length;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/50">
        <h3 className="font-semibold">搜索结果 ({totalCount})</h3>
      </div>

      <ScrollArea className="max-h-[600px]">
        <div className="divide-y">
          {/* Session Results */}
          {sessionResults.length > 0 && (
            <div className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-3">
                👤 会话
              </div>
              <div className="space-y-2">
                {sessionResults.slice(0, 10).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => navigate(`/sessions/${session.id}`)}
                    className="w-full text-left p-3 hover:bg-muted rounded transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          <SearchHighlight text={session.name} searchQuery={searchQuery} />
                        </div>
                        {session.metadata?.workingDir && (
                          <div className="text-sm text-muted-foreground truncate">
                            <SearchHighlight
                              text={session.metadata.workingDir}
                              searchQuery={searchQuery}
                            />
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(session.createdAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Results */}
          {messageResults.length > 0 && (
            <div className="p-4">
              <div className="text-sm font-medium text-muted-foreground mb-3">
                🤖 消息
              </div>
              <div className="space-y-2">
                {messageResults.slice(0, 10).map((message) => (
                  <button
                    key={message.id}
                    onClick={() => navigate(`/sessions/${message.sessionId}`)}
                    className="w-full text-left p-3 hover:bg-muted rounded transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{message.sessionName}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          <SearchHighlight text={message.content} searchQuery={searchQuery} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
