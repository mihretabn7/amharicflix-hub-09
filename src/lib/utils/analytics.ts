export const processWatchTimeData = (data: any[]) => {
    return data.map(item => ({
        date: new Date(item.created_at).toLocaleDateString(),
        duration: item.watch_duration
    }));
};

export const processUserRetention = (data: any[]) => {
    return data.map(item => ({
        date: new Date(item.last_sign_in).toLocaleDateString(),
        count: 1
    }));
};

export const processHeatmapData = (data: any[]) => {
    return data.reduce((acc: any, item) => {
        const date = new Date(item.created_at);
        const day = date.getDay();
        const hour = date.getHours();
        acc[day] = acc[day] || Array(24).fill(0);
        acc[day][hour]++;
        return acc;
    }, []);
};

export const processGenreTrends = (data: any[]) => {
    return data.reduce((acc: any[], curr) => {
        const existing = acc.find(item => item.genre === curr.genre);
        if (existing) {
            existing.count += curr.watch_count || 0;
        } else {
            acc.push({ genre: curr.genre, count: curr.watch_count || 0 });
        }
        return acc;
    }, []);
};

export const processLanguageDistribution = (data: any[]) => {
    return data.reduce((acc: any[], curr) => {
        const existing = acc.find(item => item.language === curr.language);
        if (existing) {
            existing.count += curr.watch_count || 0;
        } else {
            acc.push({ language: curr.language, count: curr.watch_count || 0 });
        }
        return acc;
    }, []);
}; 