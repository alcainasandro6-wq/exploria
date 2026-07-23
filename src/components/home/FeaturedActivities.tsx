import { ActivitiesTopRow } from '@/components/home/ActivitiesTopRow'
import { ActivityPackages } from '@/components/home/ActivityPackages'
import { getPublishedActivities } from '@/lib/services/activities'

export async function FeaturedActivities() {
  const activities = (await getPublishedActivities({ sort: 'relevance' })).slice(0, 20)

  if (activities.length === 0) return null

  const topRowActivities = activities.slice(0, 8)
  const packageActivities = activities.length > 4 ? activities.slice(4, 6) : activities.slice(0, 2)

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <ActivitiesTopRow activities={topRowActivities} />
        <ActivityPackages activities={packageActivities} />
      </div>
    </section>
  )
}
